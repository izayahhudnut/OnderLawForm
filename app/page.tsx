import Navbar from "@/components/Navbar";
import Form from "@/components/Form";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full ">
        <Form />
      </main>
    </div>
  );
}