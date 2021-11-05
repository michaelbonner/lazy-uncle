/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Head from "next/head";
import { useState } from "react";
import { IoLogoGithub, IoLogoGoogle } from "react-icons/io5";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const [showMobileNav, setShowMobileNav] = useState(false);
  const { data: session } = useSession();

  return (
    <div>
      <Head>
        <title>Lazy Uncle App</title>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#00aba9" />
        <meta name="theme-color" content="#ffffff" />
      </Head>

      <div className="relative bg-gray-800 overflow-hidden">
        <div className="hidden sm:block sm:absolute sm:inset-0">
          <svg
            className="absolute bottom-0 right-0 transform translate-x-1/2 mb-48 text-gray-700 lg:top-0 lg:mt-28 lg:mb-0 xl:transform-none xl:translate-x-0"
            width="364"
            height="384"
            viewBox="0 0 364 384"
            fill="none"
          >
            <defs>
              <pattern
                id="eab71dd9-9d7a-47bd-8044-256344ee00d0"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <rect x="0" y="0" width="4" height="4" fill="currentColor" />
              </pattern>
            </defs>
            <rect
              width="364"
              height="384"
              fill="url(#eab71dd9-9d7a-47bd-8044-256344ee00d0)"
            />
          </svg>
        </div>
        <div className="relative pt-6 pb-12 sm:pb-32">
          <nav className="relative max-w-screen-xl mx-auto flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center flex-1">
              <div className="flex items-center justify-between w-full md:w-auto">
                <Link href="/">
                  <a aria-label="Home">
                    <svg
                      className="h-12 fill-current text-white"
                      style={{ enableBackground: "new 0 0 220 53.8" }}
                      version="1.1"
                      viewBox="0 0 220 53.8"
                      x="0px"
                      xmlns="http://www.w3.org/2000/svg"
                      y="0px"
                    >
                      <g>
                        <g>
                          <path
                            d="M31.1,3.5C18.2,3.5,7.7,14,7.7,26.9s10.5,23.4,23.4,23.4s23.4-10.5,23.4-23.4S44,3.5,31.1,3.5z M38.9,14.3
			c4.5,0,8.1,3.7,8.1,8.2c0,4.5-3.7,8.1-8.2,8.1c-4.5,0-8.1-3.7-8.1-8.1C30.7,18,34.8,18.6,38.9,14.3L38.9,14.3z M21.5,20.4
			c3.7,0,6.7-0.1,6.7,3.6c0,3.7-3,6.7-6.7,6.7c-3.7,0-6.7-3-6.7-6.7C14.8,20.3,17.8,20.4,21.5,20.4C21.5,20.4,21.5,20.4,21.5,20.4z
			 M12.9,34.7c2.8-1.5,6.3-2.2,8.5-2.2c1.7,0,3.9,0.3,6,1.1c-1.4,0.8-2.7,1.8-3.8,3c-1.5,1.7-2.3,3.7-2.3,5.7v1.7
			C17.6,41.9,14.7,38.6,12.9,34.7L12.9,34.7z M31.1,46.7c-2.3,0-4.5-0.4-6.7-1.2v-3c0-5.9,9.6-8.9,14.5-8.9c2.6,0,6.6,0.9,9.7,2.6
			C45.1,42.6,38.4,46.7,31.1,46.7L31.1,46.7z"
                          />
                        </g>
                        <text
                          transform="matrix(1 0 0 1 59.676 43.7366)"
                          style={{ fontSize: "2rem" }}
                        >
                          LazyUncle
                        </text>
                      </g>
                    </svg>
                  </a>
                </Link>
                <div className="-mr-2 flex items-center md:hidden">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:bg-gray-700 focus:outline-none focus:bg-gray-700 transition duration-150 ease-in-out"
                    id="main-menu"
                    aria-label="Main menu"
                    aria-haspopup="true"
                    onClick={() => setShowMobileNav(!showMobileNav)}
                  >
                    <svg
                      className="h-6 w-6"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="hidden md:flex">
              {!session ? (
                <button
                  onClick={() => signIn()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:shadow-outline-gray focus:border-gray-700 active:bg-gray-700 transition duration-150 ease-in-out"
                >
                  Log in
                </button>
              ) : (
                <div className="flex space-x-4 items-center">
                  <Link href="/dashboard">
                    <a className="text-white underline">Dashboard</a>
                  </Link>
                  <button
                    className="text-white underline"
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </button>
                  <img
                    className="w-6 h-6 rounded-full shadow"
                    src={session.user.image}
                    alt="avatar"
                  />
                </div>
              )}
            </div>
          </nav>

          <div
            className={`${
              showMobileNav ? "absolute" : "hidden"
            } top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden`}
          >
            <div className="rounded-lg shadow-md">
              <div
                className="rounded-lg bg-white shadow-xs overflow-hidden"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="main-menu"
              >
                <div className="px-5 pt-4 flex items-center justify-between">
                  <div>
                    <svg
                      className="h-12 fill-current text-green-400"
                      style={{ enableBackground: "new 0 0 220 53.8" }}
                      version="1.1"
                      viewBox="0 0 220 53.8"
                      x="0px"
                      xmlns="http://www.w3.org/2000/svg"
                      y="0px"
                    >
                      <g>
                        <g>
                          <path
                            d="M31.1,3.5C18.2,3.5,7.7,14,7.7,26.9s10.5,23.4,23.4,23.4s23.4-10.5,23.4-23.4S44,3.5,31.1,3.5z M38.9,14.3
			c4.5,0,8.1,3.7,8.1,8.2c0,4.5-3.7,8.1-8.2,8.1c-4.5,0-8.1-3.7-8.1-8.1C30.7,18,34.8,18.6,38.9,14.3L38.9,14.3z M21.5,20.4
			c3.7,0,6.7-0.1,6.7,3.6c0,3.7-3,6.7-6.7,6.7c-3.7,0-6.7-3-6.7-6.7C14.8,20.3,17.8,20.4,21.5,20.4C21.5,20.4,21.5,20.4,21.5,20.4z
			 M12.9,34.7c2.8-1.5,6.3-2.2,8.5-2.2c1.7,0,3.9,0.3,6,1.1c-1.4,0.8-2.7,1.8-3.8,3c-1.5,1.7-2.3,3.7-2.3,5.7v1.7
			C17.6,41.9,14.7,38.6,12.9,34.7L12.9,34.7z M31.1,46.7c-2.3,0-4.5-0.4-6.7-1.2v-3c0-5.9,9.6-8.9,14.5-8.9c2.6,0,6.6,0.9,9.7,2.6
			C45.1,42.6,38.4,46.7,31.1,46.7L31.1,46.7z"
                          />
                        </g>
                        <text
                          transform="matrix(1 0 0 1 59.676 43.7366)"
                          style={{ fontSize: "2rem" }}
                        >
                          LazyUncle
                        </text>
                      </g>
                    </svg>
                  </div>
                  <div className="-mr-2">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out"
                      aria-label="Close menu"
                      onClick={() => setShowMobileNav(!showMobileNav)}
                    >
                      <svg
                        className="h-6 w-6"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  {!session ? (
                    <Link href="/api/auth/signin">
                      <a
                        className="block w-full px-5 py-3 text-center font-medium text-green-600 bg-gray-50 hover:bg-gray-100 hover:text-green-700 focus:outline-none focus:bg-gray-100 focus:text-green-700 transition duration-150 ease-in-out"
                        role="menuitem"
                      >
                        Log in
                      </a>
                    </Link>
                  ) : (
                    <div>
                      <span className="text-white">
                        Welcome {session.user.name}
                      </span>
                      <Link href="/api/auth/signout">
                        <a className="text-white underline">Sign Out</a>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <main className="mt-8 sm:mt-16 md:mt-20 lg:mt-24">
            <div className="mx-auto max-w-screen-xl">
              <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                <div className="px-4 sm:px-6 sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left lg:flex lg:items-center">
                  <div>
                    <h2 className="mt-4 text-4xl tracking-tight leading-10 font-extrabold text-white sm:mt-5 sm:leading-none sm:text-6xl lg:mt-6 lg:text-5xl xl:text-6xl">
                      Easy way to
                      <br className="hidden md:inline" />
                      <span className="text-green-400">track birthdays</span>
                    </h2>
                    <p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                      Do you have so many birthdays and no easy way to keep
                      track of them? Do we have the solution for you! Easily
                      enter the birthdays, we&apos;ll tell you how old they are
                      and remind you of their birthday when it comes near.
                    </p>
                  </div>
                </div>
                <div className="mt-12 sm:mt-16 lg:mt-0 lg:col-span-6">
                  <div className="bg-white sm:max-w-md sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden">
                    <div className="px-4 py-8 sm:px-10">
                      <div>
                        <p className="text-sm leading-5 font-medium text-gray-700">
                          Sign in with
                        </p>

                        <div className="mt-1 grid grid-cols-2 gap-3">
                          <div>
                            <span className="w-full inline-flex rounded-md shadow-sm">
                              <button
                                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md bg-white text-sm leading-5 font-medium text-gray-500 hover:text-gray-400 focus:outline-none focus:border-green-300 focus:shadow-outline-green transition duration-150 ease-in-out"
                                aria-label="Sign in with Google"
                                onClick={() => signIn("google")}
                              >
                                <IoLogoGoogle className="w-5 h-5 fill-current" />
                              </button>
                            </span>
                          </div>

                          <div>
                            <span className="w-full inline-flex rounded-md shadow-sm">
                              <button
                                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md bg-white text-sm leading-5 font-medium text-gray-500 hover:text-gray-400 focus:outline-none focus:border-green-300 focus:shadow-outline-green transition duration-150 ease-in-out"
                                aria-label="Sign in with GitHub"
                                onClick={() => signIn("github")}
                              >
                                <IoLogoGithub className="w-5 h-5 fill-current" />
                              </button>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-6 bg-gray-50 border-t-2 border-gray-200 sm:px-10">
                      <p className="text-xs leading-5 text-gray-500">
                        By signing up, you agree to our{" "}
                        <Link href="/privacy">
                          <a className="font-medium text-gray-900 hover:underline">
                            Terms
                          </a>
                        </Link>
                        ,{" "}
                        <Link href="/privacy">
                          <a className="font-medium text-gray-900 hover:underline">
                            Data Policy
                          </a>
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy">
                          <a className="font-medium text-gray-900 hover:underline">
                            Cookies Policy
                          </a>
                        </Link>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
