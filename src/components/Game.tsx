import * as React from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Toaster, toast } from "sonner";
import { ModeToggle } from "./ModeToogle";
import { Github, Lightbulb } from "lucide-react";
import { countryListAlpha2 } from "@/lib/countries";

export default function Game() {
  const [countryCode, setCountryCode] = React.useState<string>("cz");
  const [countryName, setCountryName] = React.useState<string>("Czechia");
  const [score, setScore] = React.useState<number>(0);
  const [highScore, setHighScore] = React.useState<number>(0);
  const [answer, setAnswer] = React.useState<string>("");
  const [animate, setAnimate] = React.useState<boolean>(false);

  // Highscore impl for later
  // if (highScore < score ) setHighScore(score)

  React.useEffect(() => {
    // fetch("https://flagcdn.com/en/codes.json")
    //   .then((response) => response.json())
    //   .then((data) => console.log(data))
    //   .catch((error) => console.error(error));
    gameSetup();
  }, []);

  function gameSetup() {
    const country = getRandomCountry(countryListAlpha2);
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

    if (
      formJson.guess.toString().toLowerCase() ==
      removeThe(countryName.toLowerCase())
    ) {
      setScore(score + 1);
      setAnimate(true);
      toast.success(`Correct! That was ${removeThe(countryName)}.`);
      console.log("correct");
      gameSetup();
    } else {
      toast.error(`Incorrect! That was ${removeThe(countryName)}.`);
      console.log(removeThe(countryName));
      setAnimate(false);
      gameSetup();
      formJson.guess = "";
    }
    // Reset input
    setAnswer("");
  }
  function getRandomCountry(
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
  function removeThe(input: string): string {
    // Use regular expression to match "(the)" case insensitive globally
    const regex = /\(the\)/gi;

    // Replace "(the)" occurrences with an empty string
    const result = input.replace(regex, "");

    return result.trim();
  }

  const hint: string = countryName
    .split("")
    .map((char, index) => (index % 2 === 1 ? "_" : char))
    .join("");
  return (
    <>
      <div className="absolute top-0 left-0 text-3xl m-3  text-gray-600">
        {highScore}
      </div>

      {/* <div
        className={`absolute top-0 left-0 text-5xl ml-7 mt-7 animate-bounce-short`}
      >
        {score}
      </div> */}

      {animate ? (
        <div
          className={`absolute top-0 left-0 text-5xl ml-7 mt-7 animate-bounce-short`}
          onAnimationEnd={() => setAnimate(false)}
        >
          {score}
        </div>
      ) : (
        <div className="absolute top-0 left-0 text-5xl ml-7 mt-7">{score}</div>
      )}

      <div className="absolute top-0 right-0 text-4xl m-3">
        <ModeToggle />
      </div>
      <div className="absolute bottom-0 left-0 m-3">
        <Button variant="outline" size="icon">
          <a href="https://github.com/Abdirrahman/Flags-Game" target="_blank">
            <Github />
          </a>
        </Button>
      </div>

      <div className="absolute bottom-0 right-0 m-3">
        <Popover>
          <PopoverTrigger>
            <Button variant="outline" size="icon">
              <Lightbulb />
            </Button>
          </PopoverTrigger>
          <PopoverContent>Hint: {hint}</PopoverContent>
        </Popover>
      </div>

      <img
        src={`https://flagcdn.com/${countryCode}.svg`}
        width="200"
        className="p-2"
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
        </label>
      </form>
      <Toaster richColors position="top-center" />
    </>
  );
}
