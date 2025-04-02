import Link from "next/link";

const Rules = () => {
  return (
    <div className="max-w-6xl mx-auto md:px-8 lg:px-12">
      <section className="flex flex-col items-center mt-2">
        <h1 className="text-3xl font-bold mb-6">Beach Volleyball 2v2 Rules:</h1>
        <p>
          We follow the{" "}
          <a
            className="text-blue-700 hover:text-blue-500"
            href="https://www.fivb.com/en/beachvolleyball/thegame_bvb_glossary/officialrulesofthegames"
            target="_blank"
            rel="noreferrer"
          >
            FIVB beach volleyball rules
          </a>
          . However, there are no refs to make the tough calls so we’re not too
          stingy on “doubles,” and if there is any disagreement on a call, raise
          both thumbs and ask to reserve the ball. In general, we discourage
          receiving serves and shots with an overhead hand pass (a "volley"),
          unless the ball is hit at you and there is no other way to pass the
          ball.
        </p>
        <br />
        <p>
          <b>The goal of these games is for everyone to have a fun time</b>; the
          scores and winning the games are irrelevant. If you’re new to
          volleyball, don’t worry, we’ll help you learn the rules and you’ll
          pick it up soon enough.
        </p>
        <br />
        <p>
          <a
            className="text-blue-700 hover:text-blue-500"
            href="https://www.youtube.com/watch?v=FzO7EvB7mDE"
            target="_blank"
            rel="noreferrer"
          >
            Here’s a great video
          </a>{" "}
          that explains all the unique rules of 2v2 beach volleyball.
        </p>
        <br />
        <p>
          We do have <b>one unique rule</b> to encourage everyone to interact
          with different people:{" "}
          <b>every game should be played with a different partner</b>. Try to
          play with as many different people around your skill level as you can
          throughout the day, and invite newcomers to join you to help them feel
          welcome.
        </p>
        <div className="mt-8">
          <Link href="/">
            <button className="btn">Return to dashboard</button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Rules;
