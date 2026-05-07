import { NexusGenObjects } from "../generated/nexus-typegen";
import EditBirthdayForm from "./EditBirthdayForm";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";
import { HiX } from "react-icons/hi";

const EditBirthdayDialog = ({
  birthday,
  isOpen,
  handleClose,
}: {
  birthday: NexusGenObjects["Birthday"];
  isOpen: boolean;
  handleClose: () => void;
}) => {
  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleClose}>
          <TransitionChild
            as={Fragment}
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
                as={Fragment}
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
                      Edit {birthday.name}
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
                  <EditBirthdayForm
                    birthday={birthday}
                    handleClose={handleClose}
                  />
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default EditBirthdayDialog;
