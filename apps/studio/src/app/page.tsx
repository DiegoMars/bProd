import Collections from '@/components/index/collections';
import Photos from '@/components/index/photos';

export default function Home() {
  return(
    <section className='md:w-[80%] m-auto p-[1rem]'>
      <Collections />
      <Photos />
    </section>
  );
}
