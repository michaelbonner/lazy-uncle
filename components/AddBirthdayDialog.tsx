import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import dynamic from "next/dynamic";
import { HiX } from "react-icons/hi";

const CreateBirthdayForm = dynamic(() => import("./CreateBirthdayForm"), {
  loading: () => (
    <div className="flex justify-center items-center w-full h-full text-center text-gray-800 bg-white rounded-lg border-t-4 border-b-4 min-h-[250px]">
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
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </TransitionChild>

          <div className="overflow-y-auto fixed inset-0">
            <div className="flex justify-center items-center p-4 min-h-full text-center text-gray-800">
              <TransitionChild
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="overflow-hidden p-6 w-full max-w-lg text-left align-middle bg-white rounded-2xl shadow-xl transition-all transform">
                  <div className="flex justify-between items-center">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      Add New Birthday
                    </Dialog.Title>
                    <button onClick={handleClose}>
                      <HiX className="p-1 w-8 h-8" />
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
