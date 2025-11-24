import Collections from '@/components/index/collections';
import Photos from '@/components/index/photos';

export default function Home() {
  return(
    <section className='flex flex-col gap-[1rem] md:w-[80%] m-auto p-[1rem]'>
      <Collections />
      <Photos />
    </section>
  );
}
