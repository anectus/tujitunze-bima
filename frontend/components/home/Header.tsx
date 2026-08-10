import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white shadow-md fixed top-0 left-0 w-full z-50">

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <div>
          <Link 
            href="/"
            className="text-2xl font-bold text-green-700"
          >
            Tujitunze
          </Link>

          <p className="text-xs text-gray-500">
            Health Savings & Insurance Management System
          </p>
        </div>


        {/* Navigation Menu */}
        <nav className="hidden md:flex space-x-8">

          <Link 
            href="/"
            className="text-gray-700 hover:text-green-700"
          >
            Home
          </Link>


          <Link 
            href="/about"
            className="text-gray-700 hover:text-green-700"
          >
            About
          </Link>


          <Link 
            href="/services"
            className="text-gray-700 hover:text-green-700"
          >
            Services
          </Link>


          <Link 
            href="/contact"
            className="text-gray-700 hover:text-green-700"
          >
            Contact
          </Link>

        </nav>


        {/* Authentication Buttons */}
        <div className="flex gap-3">

          {/* <Link
            href="/login"
            className="
            border border-green-700
            text-green-700
            px-5 py-2
            rounded-lg
            hover:bg-green-700
            hover:text-white
            transition"
          >
            Login
          </Link> */}


          <Link
            href="/register"
            className="
            bg-green-700
            text-white
            px-5 py-2
            rounded-lg
            hover:bg-green-800
            transition"
          >
           Become a member
          </Link>

        </div>

      </div>

    </header>
  );
}
