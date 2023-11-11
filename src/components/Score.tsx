import { memo, useState } from "react";
interface Props {
  points: number;
}

export const Score = function Score(points: any) {
  const [score, setScore] = useState<number>(0);

  setScore(score + points);

  return <>{score}</>;
};

// export const Image = ({ countryCode }: Props) => {
//   return (
//     <img
//       src={`https://flagcdn.com/${countryCode}.svg`}
//       width="200"
//       className="p-2"
//     />
//   );
//   }
