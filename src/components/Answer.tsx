import { Input } from "./ui/input";
import { Button } from "./ui/button";
import * as React from "react";
import { Toaster, toast } from "sonner";
import { countryListAlpha2 } from "@/lib/countries";

export default function MyForm() {
  function handleSubmit(e: any) {
    // Prevent the browser from reloading the page
    e.preventDefault();

    // Read the form data
    const form = e.target;
    const formData = new FormData(form);
    console.log("hi");

    // You can pass formData as a fetch body directly:
    // fetch("/some-api", { method: form.method, body: formData });

    // Or you can work with it as a plain object:
    const formJson = Object.fromEntries(formData.entries());
    console.log(formJson);

    toast.success("Correct!");
  }

  function getRandomCountryCode(
    obj: Record<string, string>
  ): [string, string] | undefined {
    const keys = Object.keys(obj);

    if (keys.length === 0) {
      return undefined;
    }

    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const randomValue = obj[randomKey];

    return [randomKey, randomValue];
  }

  return (
    <>
      <form method="post" onSubmit={handleSubmit}>
        <label>
          <Input name="myInput" placeholder="Guess Here" />
        </label>
      </form>

      <Toaster richColors position="top-center" />
    </>
  );
}
