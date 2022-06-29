import { ClientSafeProvider, getProviders, signIn } from "next-auth/react";
import React, { useEffect } from "react";
import { GrGithub, GrGoogle } from "react-icons/gr";

const Welcome = () => {
  const [providers, setProviders] = React.useState<ClientSafeProvider | Object>(
    {}
  );

  useEffect(() => {
    const getAuthProviders = async () => {
      const authProviders = await getProviders();
      if (authProviders) {
        setProviders(authProviders);
      }
    };
    getAuthProviders();
  }, []);

  return (
    <div className="flex justify-center mt-8 text-gray-100 py-12 md:py-24 px-4">
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
            <strong className="text-cyan-50">You can use it for free</strong>.
            Sign in with GitHub or Google and add some birthdays. Let me know if
            you have any problems. I hope you enjoy it!
          </p>
        </div>
        <div className="md:flex items-end md:space-x-4 mt-4 mb-1 min-h-[80px]">
          {providers &&
            Object.values(providers).map((provider) => {
              return (
                <button
                  key={provider.name}
                  className={`
                            w-full md:w-auto inline-flex justify-center space-x-2 mt-4 items-center px-6 py-3 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500
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
