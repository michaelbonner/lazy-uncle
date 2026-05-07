import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import dynamic from "next/dynamic";
import { HiX } from "react-icons/hi";

const CreateBirthdayForm = dynamic(() => import("./CreateBirthdayForm"), {
  loading: () => (
    <div className="flex h-full min-h-[250px] w-full items-center justify-center rounded-lg border border-rule bg-paper-deep text-center text-ink-soft">
      <p className="animate-pulse">Loading form…</p>
    </div>
  ),
});

const AddBirthdayDialog = ({
  isOpen,
  handleClose,
}: {
  isOpen: boolean;
  handleClose: () => void;
}) => {
  return (
    <>
      <Transition appear show={isOpen}>
        <Dialog as="div" className="relative z-10" onClose={handleClose}>
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-ink/30" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-left text-ink">
              <TransitionChild
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white p-6 align-middle shadow-[0_24px_60px_-24px_oklch(0.22_0.018_60_/_0.35)] transition-all xl:px-12 xl:py-8">
                  <div className="flex items-center justify-between">
                    <DialogTitle
                      as="h3"
                      className="font-display text-xl font-semibold leading-tight text-ink xl:text-2xl"
                    >
                      Add a birthday
                    </DialogTitle>
                    <button
                      className="cursor-pointer rounded-md p-1 text-ink-soft transition hover:bg-paper-deep hover:text-ink focus:outline-hidden focus:ring-2 focus:ring-accent/30"
                      onClick={handleClose}
                      type="button"
                      aria-label="Close"
                    >
                      <HiX className="h-6 w-6" />
                    </button>
                  </div>
                  <CreateBirthdayForm onSubmit={handleClose} />
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default AddBirthdayDialog;
