import { ClientSafeProvider, getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { GrGithub, GrGoogle } from "react-icons/gr";
import classNames from "../shared/classNames";

const Welcome = () => {
  const [providers, setProviders] = useState<ClientSafeProvider | Object>({});

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
    <div className="flex justify-center py-12 px-4 mt-8 text-gray-100 md:py-24">
      <div className="flex flex-col gap-y-6">
        <div className="mb-2 text-lg text-gray-100 prose-light prose">
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
        <div className="items-end mt-4 mb-1 md:flex md:space-x-4 min-h-[80px]">
          {providers &&
            Object.values(providers).map((provider) => {
              return (
                <button
                  key={provider.name}
                  className={classNames(
                    "mt-4 inline-flex w-full items-center justify-center space-x-2 rounded-md border border-transparent px-6 py-3 font-medium shadow-sm",
                    "md:w-auto",
                    "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
                    "bg-slate-200 text-slate-700 hover:bg-slate-100",
                  )}
                  onClick={() => signIn(provider.id)}
                >
                  {provider.id === "google" && <GrGoogle className="w-5 h-5" />}
                  {provider.id === "github" && <GrGithub className="w-6 h-6" />}
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
