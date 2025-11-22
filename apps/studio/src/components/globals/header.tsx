'use client'
import Link from 'next/link'

export default function Header() {
  return (
    <nav className='p-[1rem] lg:py-[2rem] bg-background-900 border-b-2 border-primary'>
      <div className='flex justify-between md:w-[80%] m-auto'>
        <Link href="/" className='hover:text-text-300'>
          <h1 className='text-2xl md:text-3xl'>Becker&apos;s Photography</h1>
        </Link>
        <div className='flex flex-col sm:flex-row my-auto text-xl md:text-2xl *:pl-[1rem] md:*:pl-[2rem] *:hover:text-text-300'>
          <Link href="/">Photos</Link>
          <Link href="/">Collections</Link>
        </div>
      </div>
    </nav>
  )
}
