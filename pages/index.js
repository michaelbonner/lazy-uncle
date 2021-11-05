import Link from "next/link";
import Head from "next/head";
import { useState } from "react";
import { IoLogoGithub, IoLogoGoogle } from "react-icons/io5";

export default function Home() {
  const [showMobileNav, setShowMobileNav] = useState(false);
  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div class="relative bg-gray-800 overflow-hidden">
        <div class="hidden sm:block sm:absolute sm:inset-0">
          <svg
            class="absolute bottom-0 right-0 transform translate-x-1/2 mb-48 text-gray-700 lg:top-0 lg:mt-28 lg:mb-0 xl:transform-none xl:translate-x-0"
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
        <div class="relative pt-6 pb-12 sm:pb-32">
          <nav class="relative max-w-screen-xl mx-auto flex items-center justify-between px-4 sm:px-6">
            <div class="flex items-center flex-1">
              <div class="flex items-center justify-between w-full md:w-auto">
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
                <div class="-mr-2 flex items-center md:hidden">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:bg-gray-700 focus:outline-none focus:bg-gray-700 transition duration-150 ease-in-out"
                    id="main-menu"
                    aria-label="Main menu"
                    aria-haspopup="true"
                    onClick={() => setShowMobileNav(!showMobileNav)}
                  >
                    <svg
                      class="h-6 w-6"
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
            <div class="hidden md:flex">
              <a
                href="#"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:shadow-outline-gray focus:border-gray-700 active:bg-gray-700 transition duration-150 ease-in-out"
              >
                Log in
              </a>
            </div>
          </nav>

          <div
            class={`${
              showMobileNav ? "absolute" : "hidden"
            } top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden`}
          >
            <div class="rounded-lg shadow-md">
              <div
                class="rounded-lg bg-white shadow-xs overflow-hidden"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="main-menu"
              >
                <div class="px-5 pt-4 flex items-center justify-between">
                  <div>
                    <svg
                      className="h-12 fill-current text-blue-400"
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
                  <div class="-mr-2">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out"
                      aria-label="Close menu"
                      onClick={() => setShowMobileNav(!showMobileNav)}
                    >
                      <svg
                        class="h-6 w-6"
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
                  <a
                    href="#"
                    class="block w-full px-5 py-3 text-center font-medium text-blue-600 bg-gray-50 hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:bg-gray-100 focus:text-blue-700 transition duration-150 ease-in-out"
                    role="menuitem"
                  >
                    Log in
                  </a>
                </div>
              </div>
            </div>
          </div>

          <main class="mt-8 sm:mt-16 md:mt-20 lg:mt-24">
            <div class="mx-auto max-w-screen-xl">
              <div class="lg:grid lg:grid-cols-12 lg:gap-8">
                <div class="px-4 sm:px-6 sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left lg:flex lg:items-center">
                  <div>
                    <h2 class="mt-4 text-4xl tracking-tight leading-10 font-extrabold text-white sm:mt-5 sm:leading-none sm:text-6xl lg:mt-6 lg:text-5xl xl:text-6xl">
                      Easy way to
                      <br class="hidden md:inline" />
                      <span class="text-blue-400">track birthdays</span>
                    </h2>
                    <p class="mt-3 text-base text-gray-300 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                      Do you have so many birthdays and no easy way to keep
                      track of them? Do we have the solution for you! Easily
                      enter the birthdays, we'll tell you how old they are and
                      remind you of their birthday when it comes near.
                    </p>
                  </div>
                </div>
                <div class="mt-12 sm:mt-16 lg:mt-0 lg:col-span-6">
                  <div class="bg-white sm:max-w-md sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden">
                    <div class="px-4 py-8 sm:px-10">
                      <div>
                        <p class="text-sm leading-5 font-medium text-gray-700">
                          Sign in with
                        </p>

                        <div class="mt-1 grid grid-cols-2 gap-3">
                          <div>
                            <span class="w-full inline-flex rounded-md shadow-sm">
                              <button
                                type="button"
                                class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md bg-white text-sm leading-5 font-medium text-gray-500 hover:text-gray-400 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition duration-150 ease-in-out"
                                aria-label="Sign in with Google"
                              >
                                <IoLogoGoogle class="w-5 h-5 fill-current" />
                              </button>
                            </span>
                          </div>

                          <div>
                            <span class="w-full inline-flex rounded-md shadow-sm">
                              <button
                                type="button"
                                class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md bg-white text-sm leading-5 font-medium text-gray-500 hover:text-gray-400 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition duration-150 ease-in-out"
                                aria-label="Sign in with GitHub"
                              >
                                <IoLogoGithub class="w-5 h-5 fill-current" />
                              </button>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="px-4 py-6 bg-gray-50 border-t-2 border-gray-200 sm:px-10">
                      <p class="text-xs leading-5 text-gray-500">
                        By signing up, you agree to our{" "}
                        <Link href="/privacy">
                          <a class="font-medium text-gray-900 hover:underline">
                            Terms
                          </a>
                        </Link>
                        ,{" "}
                        <Link href="/privacy">
                          <a class="font-medium text-gray-900 hover:underline">
                            Data Policy
                          </a>
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy">
                          <a class="font-medium text-gray-900 hover:underline">
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
