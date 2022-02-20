import { useState, useEffect } from 'react'
import { supabase } from '../lib/initSupabase'

import { v4 as uuidv4 } from 'uuid';

import { SubmitHandler, useForm } from 'react-hook-form'
// import { Profile } from '../../../hooks/useUser'
// import { Main } from '../../ui/Main'
import Router from 'next/router';
import { toast } from 'react-toastify';
import { SUPABASE_BUCKET_PHOTOS_PATH } from '../lib/const';
import { removeBucketPath } from '../lib/removeBucketPath';

export default function CreateUserPhotoNew({ user }) {
  // console.log('user', user)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [newImage, setImage] = useState()
  const [previewUrl, setPreviewUrl] = useState(null)

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

      return
    }

    setImage(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const onSubmit = async (data, event) => {
    const { title, is_published } = data

    if (!newImage) return

    const uuid = uuidv4()
    const newImageKey = uuid.split('-')[uuid.split('-').length - 1]
    console.log('newImageKey', newImageKey);

    try {

      // storage に画像をアップロード
      const { data: inputData } = await supabase.storage
        .from(SUPABASE_BUCKET_PHOTOS_PATH)
        .upload(`${user.id}/${newImageKey}`, data.image[0], {
          cacheControl: '3600',
          upsert: false
        })

      // const key = inputData?.Key
      // const key = data?.Key

      // if (!key) {
      //   throw new Error("Error")
      // }
      if (!newImageKey) {
        throw new Error("Error")
      }

      // .from() で bucket 指定しているので、getPublicUrl() に渡すパスからは、bucket 名は取り除く必要がある
      // NG: photos/25aea8bc-aa5e-42ce-b099-da8815c2a50f/fdf945886dfd
      // OK: 25aea8bc-aa5e-42ce-b099-da8815c2a50f/fdf945886dfd
      // const { publicURL } = supabase.storage.from(SUPABASE_BUCKET_PHOTOS_PATH).getPublicUrl(removeBucketPath(key, SUPABASE_BUCKET_PHOTOS_PATH))
      const { publicURL } = supabase.storage.from(SUPABASE_BUCKET_PHOTOS_PATH).getPublicUrl(removeBucketPath(newImageKey, SUPABASE_BUCKET_PHOTOS_PATH))
      console.log('publicURL', publicURL)

      // DBにレコード作成
      await supabase.from(SUPABASE_BUCKET_PHOTOS_PATH).insert([{
        user_id: user.id,
        title: title,
        is_published: is_published,
        url: publicURL
      }])

      toast.success("画像を投稿しました！")
      // Router.push(`/user/${user.id}`)
    } catch(error) {
      console.log(error)
      toast.error("エラーが発生しました。")
    }
  }


  return (
    <div>
      <p className="text-xl mb-4">新規投稿</p>
      <div>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col'>
          <label htmlFor="title">画像タイトル</label>
          <input id="title" className='py-1 px-2 border-2 w-80' {...register("title", { required: true })} />
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
          {previewUrl && (
            <div className='mt-4'>
              {/* <Image className='w-4/12' src={previewUrl} alt="image" width={300} height={200} layout='fixed' objectFit={"cover"} /> */}
              {/* <div className='w-4/12' src={previewUrl} alt="image" width={300} height={200} layout='fixed' objectFit={"cover"} /> */}
              <div className='w-4/12' src={previewUrl} alt="image" width={300} height={200} layout='fixed' objectfit={"cover"} />
            </div>
          )}

          <input className='border-white-300 border-2 rounded p-1 w-16 mt-4' type="submit" />
        </form>
      </div>
    </div>
  )




}

const Todo = ({ todo, onDelete }) => {
  const [isCompleted, setIsCompleted] = useState(todo.is_complete)

  const toggle = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .update({ is_complete: !isCompleted })
        .eq('id', todo.id)
        .single()
      if (error) {
        throw new Error(error)
      }
      setIsCompleted(data.is_complete)
    } catch (error) {
      console.log('error', error)
    }
  }

  return (
    <li
      onClick={(e) => {
        e.preventDefault()
        toggle()
      }}
      className="w-full block cursor-pointer hover:bg-gray-200 focus:outline-none focus:bg-gray-200 transition duration-150 ease-in-out"
    >
      <div className="flex items-center px-4 py-4 sm:px-6">
        <div className="min-w-0 flex-1 flex items-center">
          <div className="text-sm leading-5 font-medium truncate">{todo.task}</div>
        </div>
        <div>
          <input
            className="cursor-pointer"
            onChange={(e) => toggle()}
            type="checkbox"
            checked={isCompleted ? true : ''}
          />
        </div>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete()
          }}
          className="w-4 h-4 ml-2 border-2 hover:border-black rounded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="gray">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </li>
  )
}

// const Alert = ({ text }) => (
//   <div className="rounded-md bg-red-100 p-4 my-3">
//     <div className="text-sm leading-5 text-red-700">{text}</div>
//   </div>
// )
