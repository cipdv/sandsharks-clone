const Rules = ({ embedVideo = false, variant = "default" }) => {
  const isDashboardVariant = variant === "dashboard";
  const outerClass = isDashboardVariant
    ? "rounded-md border border-sandsharks-magenta/20 p-5 shadow-sm"
    : "mx-auto max-w-6xl md:px-8 lg:px-12";
  const contentClass = isDashboardVariant
    ? "space-y-4"
    : "mt-2 flex flex-col items-center space-y-4";

  return (
    <div className={outerClass}>
      <div className={contentClass}>
        <h1 className="mb-2 text-3xl font-bold">Beach Volleyball 2v2 Rules:</h1>
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
          . However, there are no refs to make the tough calls so we&apos;re not
          too stingy on &quot;doubles,&quot; and if there is any disagreement on
          a call, raise both thumbs and ask to re-serve the ball. In general, we
          discourage receiving serves and shots with an overhead hand pass (a
          &quot;volley&quot;), unless the ball is hit at you and there is no
          other way to pass the ball.
        </p>
        <p>
          <b>The goal of these games is for everyone to have a fun time</b>; the
          scores and winning the games are irrelevant. If you&apos;re new to
          volleyball, don&apos;t worry, we&apos;ll help you learn the rules and
          you&apos;ll pick it up soon enough.
        </p>
        <p>
          If you have indoor volleyball experience, but haven't played 2vs2
          beach volleyball,{" "}
          <a
            className="text-blue-700 hover:text-blue-500"
            href="https://www.youtube.com/watch?v=FzO7EvB7mDE"
            target="_blank"
            rel="noreferrer"
          >
            here&apos;s a great video
          </a>{" "}
          that explains all the unique rules of 2v2 beach volleyball.
        </p>
        {embedVideo ? (
          <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-md border border-sandsharks-magenta/20 shadow-sm">
            <iframe
              src="https://www.youtube.com/embed/FzO7EvB7mDE"
              title="Beach volleyball 2v2 rules video"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : null}
        <p>
          We do have <b>one rule unique to Sandsharks</b> to encourage everyone
          to interact with different people:{" "}
          <b>every game should be played with a different partner</b>. Try to
          play with as many different people around your skill level as you can
          throughout the day, and invite newcomers to join you to help them feel
          welcome.
        </p>
      </div>
    </div>
  );
};

export default Rules;
