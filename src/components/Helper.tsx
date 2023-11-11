import { useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";

interface Props {
  answer: string;
  countryCode: string;
  countryName: string;
  points: number;
}

export default function Helper({
  answer,
  countryCode,
  countryName,
  points,
}: Props) {
  const [score, setScore] = useState<number>(0);
  // const score = useRef<number>(0);

  useEffect(() => {
    if (answer == countryName) {
      setScore(score + points);
      console.log("Correct");
      console.log(points);
    }
    console.log("helper render");
    console.log(score);
  }, []);

  return (
    <>
      <div className="absolute top-0 right-0 ">{points}</div>
      <img
        src={`https://flagcdn.com/${countryCode}.svg`}
        width="200"
        className="p-2"
      />

      <Toaster richColors position="top-center" />
      {/* <Button onClick={() => setScore(score + 1)}>CLick - {score}</Button> */}
    </>
  );
}
