import { Input } from "./ui/input";
import { Button } from "./ui/button";
import * as React from "react";
import { Toaster, toast } from "sonner";
import { countryListAlpha2 } from "@/lib/countries";
import { Score } from "./Score";
import Helper from "./Helper";

export default function MyForm() {
  const [countryCode, setCountryCode] = React.useState<string>("cz");
  const [countryName, setCountryName] = React.useState<string>("Czechia");
  // const score = React.useRef<number>(0);
  const [score, setScore] = React.useState<number>(0);
  const [answer, setAnswer] = React.useState<string>("");
  const r = React.useRef<any>();
  // const guess = React.useRef<any>();

  React.useEffect(() => {
    // gameSetup();
    console.log(countryName);
  }, []);

  function gameSetup() {
    const country = getRandomCountryCode(countryListAlpha2);
    if (country === undefined) {
      console.log("Undefined country");
    } else {
      setCountryCode(country[0].toLowerCase());
      setCountryName(country[1]);
    }
  }
  function handleSubmit(e: any) {
    // Prevent the browser from reloading the page
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    // Read the form data

    const formJson = Object.fromEntries(formData.entries());
    console.log(formJson.guess);
    console.log(score);

    // const formData = new FormData(form);

    // You can pass formData as a fetch body directly:
    // fetch("/some-api", { method: form.method, body: formData });

    // Or you can work with it as a plain object:
    // const formJson = Object.fromEntries(formData.entries());
    // console.log(formJson.myInput);
    if (formJson.guess == countryName) {
      setScore(score + 1);
      toast.success("Correct!");
      console.log("correct");
      gameSetup();
    } else {
      toast.error("Incorrect!");
      gameSetup();
      formJson.guess = "";
    }
    setAnswer("");
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
    console.log(randomKey, randomValue);
    return [randomKey, randomValue];
  }

  return (
    <>
      <Helper
        countryCode={countryCode}
        countryName={countryName}
        answer={answer}
        points={score}
      />
      <form method="post" onSubmit={handleSubmit}>
        <label>
          <Input
            type="text"
            name="guess"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Guess Here"
          />

          {/* <Input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Guess Here"
          /> */}
        </label>
      </form>

      <Toaster richColors position="top-center" />
      {/* <Button onClick={() => setScore(score + 1)}>CLick - {score}</Button> */}
    </>
  );
}
