import Head from "next/head";
import { useState } from "react";

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
                <a href="#" aria-label="Home">
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
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
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
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
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

                        <div class="mt-1 grid grid-cols-3 gap-3">
                          <div>
                            <span class="w-full inline-flex rounded-md shadow-sm">
                              <button
                                type="button"
                                class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md bg-white text-sm leading-5 font-medium text-gray-500 hover:text-gray-400 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition duration-150 ease-in-out"
                                aria-label="Sign in with Facebook"
                              >
                                <svg
                                  class="w-5 h-5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </span>
                          </div>

                          <div>
                            <span class="w-full inline-flex rounded-md shadow-sm">
                              <button
                                type="button"
                                class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md bg-white text-sm leading-5 font-medium text-gray-500 hover:text-gray-400 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition duration-150 ease-in-out"
                                aria-label="Sign in with Twitter"
                              >
                                <svg
                                  class="w-5 h-5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                                </svg>
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
                                <svg
                                  class="w-5 h-5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="px-4 py-6 bg-gray-50 border-t-2 border-gray-200 sm:px-10">
                      <p class="text-xs leading-5 text-gray-500">
                        By signing up, you agree to our{" "}
                        <a
                          href="#"
                          class="font-medium text-gray-900 hover:underline"
                        >
                          Terms
                        </a>
                        ,{" "}
                        <a
                          href="#"
                          class="font-medium text-gray-900 hover:underline"
                        >
                          Data Policy
                        </a>{" "}
                        and{" "}
                        <a
                          href="#"
                          class="font-medium text-gray-900 hover:underline"
                        >
                          Cookies Policy
                        </a>
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
