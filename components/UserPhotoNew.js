import { useState, useEffect } from 'react'
import { supabase } from '../lib/initSupabase'
import { v4 as uuidv4 } from 'uuid';

import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify';
import { SUPABASE_BUCKET_PHOTOS_PATH } from '../lib/const';
import { removeBucketPath } from '../lib/removeBucketPath';

import Image from 'next/image'

export default function CreateUserPhotoNew({ url,user }) {

  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [photos, setPhotos] = useState([])
  const [previewUrl, setPreviewUrl] = useState(null)
  const [errorText, setError] = useState('')

  // DBから取得した画像一覧をステートで管理
  useEffect(() => {
    fetchPhotos()
  }, [])

  // 画像情報を DBから取得
  const fetchPhotos = async () => {
    // supabase DB photos のデータをすべて取得
    let { data: photos, error } = await supabase.from('photos').select('*').order('id', true)
    if (error) console.log('error', error)
    // URLオブジェクトにする時用のパスに整形
    for (let i = 0; i < photos.length; i++) { 
      let path = photos[i].url.replace('https://bwhahbwtecvxdsgymnbf.supabase.co/storage/v1/object/public/photos/', '')
      photos[i].path = path
      let { data, error } = await supabase.storage.from('photos').download(path)
      // URLオブジェクト化した変数を配列 photos の url にして格納
      let objURL = URL.createObjectURL(data)   
      photos[i].url = objURL
      setPhotos([...photos])
    }
  }  

  // 添付ファイルの扱い
  const handleFile = async (event) => {
    if (event.target.files === null || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    const size = file.size

    if (size > 1000000) {
      toast.error('ファイルサイズは1MB以内にしてください。')
      reset()
      setPreviewUrl(null)
      setImage(null)
      setNewImage(null)
      return
    }

    console.log('createdURL', URL.createObjectURL(file))
    // プレビュー用をステートに持たせる
    setPreviewUrl(URL.createObjectURL(file))
  }

  // submit時
  const onSubmit = async (data, event) => {

    const { title, is_published } = data

    // 画像のユニークIDとイメージキーの生成
    const uuid = uuidv4()
    const newImageKey = uuid.split('-')[uuid.split('-').length - 1]

    try {
      // console.log('user.id key',`${user.id}/${newImageKey}`)
      // storage に画像をアップロード
      const { data: inputData } = await supabase.storage
        .from(SUPABASE_BUCKET_PHOTOS_PATH)
        .upload(`${user.id}/${newImageKey}`, data.image[0], {
          cacheControl: '3600',
          upsert: false
        })
      
      const key = inputData?.Key

      if (!key) {
        throw new Error("Error")
      }

      // .from() で bucket 指定しているので、getPublicUrl() に渡すパスからは、bucket 名は取り除く必要がある
      const { publicURL } = supabase.storage.from(SUPABASE_BUCKET_PHOTOS_PATH).getPublicUrl(removeBucketPath(key, SUPABASE_BUCKET_PHOTOS_PATH))
      console.log('publicURL', publicURL)

      // DBにレコード作成
      let { data: photo, error } = await supabase.from(SUPABASE_BUCKET_PHOTOS_PATH).insert([{
        user_id: user.id,
        title: title,
        is_published: is_published,
        url: publicURL,
        path: publicURL.replace('https://bwhahbwtecvxdsgymnbf.supabase.co/storage/v1/object/public/photos/', '')
      }]).single()

      toast.success("画像を投稿しました！")
      // Router.push(`/user/${user.id}`)
      if (error) setError(error.message)
      // 画像一覧ステートにプレビュー画像（URLオブジェクトになったもの）を追加
      let previewDate = photo
      // let previewDate = data
      previewDate.url = previewUrl
      previewDate.path = publicURL.replace('https://bwhahbwtecvxdsgymnbf.supabase.co/storage/v1/object/public/photos/', '')

      // ステートに値を持たせる
      setPhotos([...photos, previewDate])

      // プレビュー画像を消す
      setPreviewUrl(null)

      // フォームを空にする
      reset()
      
    } catch(error) {
      console.log(error)
      toast.error("エラーが発生しました。")
    }
  }

  // DB から画像情報の削除
  const deletePhoto = async (id,path) => {
    try {
      console.log('id', id)
      await supabase.from(SUPABASE_BUCKET_PHOTOS_PATH).delete().eq('id', id)
      // photos配列の該当画像情報も削除
      setPhotos(photos.filter((x) => x.id != id))

      deleteStoragePhoto(path)
      
    } catch (error) {
      console.log('error', error)
    }
  }

  // ストレージの画像削除
  const deleteStoragePhoto = async (path) => {
      await supabase
      .storage
      .from(SUPABASE_BUCKET_PHOTOS_PATH)
      .remove([path])
  }

  return (
    <div>
      <p className="text-xl mb-5">ショッピングレビュー</p>
      <div>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col'>
          <label htmlFor="title">アイテム名と感想</label>
          <input id="title" className='py-1 px-2 border-2 w-80' placeholder='アイテム名/感想'{...register("title", { required: true })} />
          {errors.title && <span>This field is required</span>}

          <label htmlFor="is_published" className='mt-4'>公開状態</label>
          <input type="checkbox" id="is_published" className='py-1 px-2 border-2 w-4' {...register("is_published")} />

          <label htmlFor="image" className='mt-4'>画像を選択</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            multiple
            {...register("image", { onChange: handleFile, required: true })}
          />
          {/* プレビュー画像があれば表示・なければ何も表示しない */}
          <div className='mt-4'>
            {previewUrl ? <Image className='w-4/12' src={previewUrl} alt="image" width={150} height={100} layout='fixed' objectfit={"cover"} /> : <></>}
          </div>
          
          <input className='bg-white rounded p-1 w-12 mb-5 mt-5' type="submit" />
        </form>
      </div>

      {/* 投稿画像一覧と削除ボタンを表示 */}
      
      {!!errorText && <Alert text={errorText} />}
      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul>
          {photos.map((photo) => (
            <li>
              <div className="w-full h-full flex justify-between items-center p-4">
                <Image key={photo.id} className='w-4/12' src={photo.url} alt="image" width={150} height={100} layout='fixed' objectfit={"cover"} />
                <p>{photo.title}</p>
                <button onClick={() => deletePhoto(photo.id,photo.path)} className='border-gray-300 border-2 rounded p-1 w-12'>削除</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const Alert = ({ text }) => (
  <div className="rounded-md bg-red-100 p-4 my-3">
    <div className="text-sm leading-5 text-red-700">{text}</div>
  </div>
)
