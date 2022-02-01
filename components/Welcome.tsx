import { Provider } from "next-auth/providers";
import { signIn } from "next-auth/react";
import React from "react";
import { GrGithub, GrGoogle } from "react-icons/gr";

const Welcome = ({ providers = [] }: { providers: Provider[] }) => {
  return (
    <div className="flex justify-center mt-8 text-gray-100 py-24">
      <div className="flex flex-col gap-y-6">
        <div className="text-lg mb-2 prose prose-light text-gray-100">
          <h1 className="text-white">
            Lazy Uncle helps you keep track of birthdays
          </h1>
          <p>
            Welcome to Lazy Uncle. I built this app to keep track of the
            birthdays of my nieces and nephews. It&apos;s really simple, and
            does just one job.
          </p>
          <p>
            <strong className="text-indigo-50">You can use it for free</strong>.
            Sign in with GitHub or Google and add some birthdays. Let me know if
            you have any problems. I hope you enjoy it!
          </p>
        </div>
        <div className="flex items-end space-x-4 mt-4 mb-1">
          {Object.values(providers).map((provider) => {
            return (
              <button
                key={provider.name}
                className={`
                            inline-flex space-x-2 items-center px-6 py-3 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                            ${
                              provider.id === "google" &&
                              `bg-red-500 hover:bg-red-600 text-red-50`
                            }
                            ${
                              provider.id === "github" &&
                              `bg-gray-200 hover:bg-gray-100 text-gray-700`
                            }
                            `}
                onClick={() => signIn(provider.id)}
              >
                {provider.id === "github" && <GrGithub />}
                {provider.id === "google" && <GrGoogle />}
                <span>Sign in with {provider.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default Welcome;
