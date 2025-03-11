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
    <div className="flex h-full min-h-[250px] w-full items-center justify-center rounded-lg border-t-4 border-b-4 bg-white text-center text-gray-800">
      <p className="animate-pulse">Loading form...</p>
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
            <div className="fixed inset-0 bg-cyan-600/25" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center text-gray-800">
              <TransitionChild
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all xl:px-12 xl:py-8">
                  <div className="flex items-center justify-between">
                    <DialogTitle
                      as="h3"
                      className="text-lg leading-6 font-medium text-gray-900 xl:text-xl"
                    >
                      Add New Birthday
                    </DialogTitle>
                    <button
                      className="cursor-pointer"
                      onClick={handleClose}
                      type="button"
                    >
                      <HiX className="h-8 w-8 p-1" />
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
