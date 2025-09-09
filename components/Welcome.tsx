import clsx from "clsx";
import { toast } from "react-hot-toast";
import { GrGithub, GrGoogle } from "react-icons/gr";
import { authClient } from "../lib/auth-client";

const Welcome = () => {
  const providers = [
    {
      id: "github",
      name: "GitHub",
    },
    {
      id: "google",
      name: "Google",
    },
  ];

  const signIn = async (provider: string) => {
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: "/birthdays",
    });

    if (error) {
      console.error(error);
      toast.error("An error occurred while signing in. Please try again.");
    }
  };

  return (
    <div className="mt-8 flex justify-center px-4 py-12 text-gray-100 md:py-24">
      <div className="flex flex-col gap-y-6">
        <div className="prose-light prose mb-2 text-lg text-gray-100">
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
        <div className="mt-4 mb-1 min-h-[80px] items-end md:flex md:space-x-4">
          {providers &&
            Object.values(providers).map((provider) => {
              return (
                <button
                  key={provider.name}
                  className={clsx(
                    "mt-4 inline-flex w-full items-center justify-center space-x-2 rounded-md border border-transparent px-6 py-3 font-medium shadow-xs",
                    "md:w-auto",
                    "focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:outline-hidden",
                    "bg-slate-200 text-slate-700 hover:bg-slate-100",
                  )}
                  onClick={() => signIn(provider.id)}
                >
                  {provider.id === "google" && <GrGoogle className="h-5 w-5" />}
                  {provider.id === "github" && <GrGithub className="h-6 w-6" />}
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
