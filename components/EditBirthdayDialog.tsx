import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";
import { HiX } from "react-icons/hi";
import { NexusGenObjects } from "../generated/nexus-typegen";
import EditBirthdayForm from "./EditBirthdayForm";

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
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center text-gray-800">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between">
                    <DialogTitle
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      Edit {birthday.name}
                    </DialogTitle>
                    <button onClick={handleClose}>
                      <HiX className="h-8 w-8 p-1" />
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
