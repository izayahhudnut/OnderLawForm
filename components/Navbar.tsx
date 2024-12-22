import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="flex items-center p-4 bg-white">
      <Image
        src="/logo.png"
        alt="Logo"
        width={230} // Adjust the width as needed
        height={230} // Adjust the height as needed
        className="cursor-pointer"
      />
    </nav>
  );
};
