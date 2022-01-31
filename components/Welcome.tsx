import { Provider } from "next-auth/providers";
import { signIn } from "next-auth/react";
import React from "react";
import { GrGithub, GrGoogle } from "react-icons/gr";

const Welcome = ({ providers }: { providers: Provider[] }) => {
  return (
    <div className="flex justify-center mt-8">
      <div className="flex flex-col gap-y-6">
        <div className="text-lg mb-2 prose">
          <h1>Lazy Uncle helps you keep track of birthdays</h1>
          <p>
            Welcome to Lazy Uncle. I built this app to keep track of the
            birthdays of my nieces and nephews. It&apos;s really simple, and
            does just one job.
          </p>
          <p>
            <strong>You can use it for free</strong>. Sign in with GitHub or
            Google and add some birthdays. Let me know if you have any problems.
            I hope you enjoy it!
          </p>
        </div>
        <div className="flex items-end space-x-4 mb-12">
          {Object.values(providers).map((provider) => {
            return (
              <button
                key={provider.name}
                className={`
                            inline-flex space-x-2 items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                            ${
                              provider.id === "google" &&
                              `bg-blue-600 hover:bg-blue-700`
                            }
                            ${
                              provider.id === "github" &&
                              `bg-gray-600 hover:bg-gray-700`
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
