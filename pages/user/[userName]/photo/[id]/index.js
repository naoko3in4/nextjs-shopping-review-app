// import type { GetServerSidePropsContext, NextPage } from 'next'
import { UserPhoto } from '../../../../../components/page/UserPhoto';
import { Layout } from '../../../../../components/ui/Layout';
import { PublicPhoto } from '../../../../../types/publicPhoto';
import { SUPABASE_BUCKET_PHOTOS_PATH } from '../../../../../utils/const';
import { supabase } from '../../../../../utils/supabaseClient';

export async function getServerSideProps({ params }) {
  const { data: photoData } = await supabase
    .from(SUPABASE_BUCKET_PHOTOS_PATH)
    .select(`*, user: userId(*), likes(*), comments(*, user: userId(*))`)
    .eq("id", params?.id)
    .single()

  if (!photoData || !photoData.is_published) {
    return { notFound: true }
  }
  return { props: { photoData } };
}

const UserPhotoPage = ({ photoData}) => {
  return (
    <Layout>
      <UserPhoto photoData={photoData}/>
    </Layout>
  )
}

export default UserPhotoPage
