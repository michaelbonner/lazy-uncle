import MainLayout from "../components/layout/MainLayout";

const Contact = () => {
  return (
    <MainLayout title="Contact Michael Bonner">
      <div className="py-12 px-4 my-16 mx-4 max-w-5xl bg-white rounded-lg md:px-16 md:mx-auto">
        <div className="px-4 max-w-5xl text-gray-700 prose">
          <h1 className="text-gray-800">Contact Michael Bonner</h1>
          <p>
            Here&apos;s a couple links to get in touch with me. I would give you
            my phone number, but I&apos;ve been told that&apos;s a bad idea.
          </p>
          <div className="flex space-x-4">
            <p>
              <a href="https://michaelbonner.dev/">Personal Site</a>
            </p>
            <p>
              <a href="https://github.com/michaelbonner">Github</a>
            </p>
            <p>
              <a href="https://www.instagram.com/michael__bonner">Instagram</a>
            </p>
            <p>
              <a href="https://www.linkedin.com/in/michaelbonner/">LinkedIn</a>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
export default Contact;
