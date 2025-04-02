import { replyToPost, replyToBeginnerClinic } from "@/app/_actions";
import Image from "next/image";

const Posts = async ({ posts, user }) => {
  posts = JSON.parse(JSON.stringify(posts));
  user = JSON.parse(JSON.stringify(user));

  function convertTo12Hour(time) {
    if (!time) {
      return "N/A";
    }
    const [hour, minute] = time.split(":");
    return new Date(1970, 0, 1, hour, minute).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  }

  return (
    <div>
      <ul>
        {posts?.map((post) => {
          // Add a check for post.date before trying to split it
          let formattedDate = "No date specified";

          if (post.date) {
            const [year, month, day] = post.date.split("-");
            const date = new Date(year, month - 1, day);
            formattedDate = `${date.toLocaleString("en-US", {
              month: "long",
            })} ${date.getDate()}, ${date.getFullYear()}`;
          }

          return (
            <div className="bg-blue-100 rounded-md mt-4 pb-1" key={post._id}>
              <li className="bg-blue-100 p-4 rounded-md mt-4">
                <h1 className="font-bold text-2xl mb-2">{post.title}</h1>
                <h3>Posted by: {post.postedBy}</h3>
                <div className="overflow-auto break-words">
                  {post.message.split("<br />").map((line, index) => (
                    <p key={`${post._id}-${index}`}>
                      {line}
                      <br />
                    </p>
                  ))}
                  {post.includeButton && (
                    <form
                      action={async () => {
                        "use server";
                        await replyToPost(post._id);
                      }}
                    >
                      <button type="submit" className="btn mt-4">
                        {post.replies.some(
                          (reply) => reply.email === user?.email
                        )
                          ? post.buttonOption2 || "Option 2"
                          : post.buttonOption1 || "Option 1"}
                      </button>
                    </form>
                  )}
                </div>

                {post.startTime && (
                  <div>
                    <div className="mt-4">
                      <h1>When:</h1>
                      <p>{formattedDate}</p>
                      <p>Start time: {convertTo12Hour(post.startTime)}</p>
                      <p>End time: {convertTo12Hour(post.endTime)}</p>
                    </div>
                    <div className="mt-4 mb-4">
                      <h1>Court numbers:</h1>
                      <p>{post.courts || "TBD"}</p>
                    </div>
                    <div className="mt-4 mb-4">
                      <h1>Who's going:</h1>
                      <div
                        className="grid grid-cols-1 gap-2 mt-2"
                        style={{
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(40px, 1fr))",
                        }}
                      >
                        {post.replies.map((reply) => (
                          <div
                            key={reply._id}
                            className="flex flex-col items-center group"
                          >
                            <div
                              className="relative rounded-full overflow-hidden"
                              style={{
                                width: "40px",
                                height: "40px",
                                position: "relative",
                              }}
                            >
                              <div style={{ paddingTop: "100%" }}>
                                <Image
                                  src={
                                    reply?.pic ||
                                    "/images/sandsharks-rainbow-icon.svg"
                                  }
                                  alt={reply?.name}
                                  fill={true}
                                  className="absolute top-0 left-0 object-cover object-center"
                                />
                              </div>
                            </div>
                            <div className="text-center mt-1 text-xs">
                              {reply?.firstName || reply?.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </li>
              {new Date() <
                new Date(
                  new Date(post.date).setDate(new Date(post.date).getDate() + 1)
                ) && (
                <form
                  action={async () => {
                    "use server";
                    await replyToPost(post._id);
                  }}
                >
                  <button type="submit" className="btn ml-4">
                    {post.replies.some((reply) => reply.email === user?.email)
                      ? post.buttonOption2 || "I can no longer go :("
                      : post.buttonOption1 || "I'll be there! :)"}
                  </button>
                </form>
              )}
              {post?.startTime &&
                (post?.beginnerClinic &&
                post?.beginnerClinic?.beginnerClinicOffered ? (
                  <div className="bg-blue-300 rounded-lg p-4 m-4 mb-8">
                    <h1>Beginner Clinic:</h1>
                    <p className="overflow-auto break-words">
                      {post?.beginnerClinic?.beginnerClinicMessage}
                    </p>
                    <p className="mt-4">
                      Start time:{" "}
                      {convertTo12Hour(
                        post?.beginnerClinic?.beginnerClinicStartTime
                      )}
                    </p>
                    <p>
                      End time:{" "}
                      {convertTo12Hour(
                        post?.beginnerClinic?.beginnerClinicEndTime
                      )}
                    </p>
                    <p className="mt-4">
                      Court number:{" "}
                      {post?.beginnerClinic?.beginnerClinicCourts || "TBD"}
                    </p>
                    <div className="mt-4 mb-4">
                      <h1>Who's going:</h1>
                      <div className="flex flex-row flex-wrap">
                        {post?.beginnerClinic?.beginnerClinicReplies?.map(
                          (reply) => (
                            <div
                              key={reply._id}
                              className="flex flex-col items-start group mt-2 mr-2"
                            >
                              <div
                                className="relative rounded-full overflow-hidden"
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  position: "relative",
                                }}
                              >
                                <div style={{ paddingTop: "100%" }}>
                                  <Image
                                    src={
                                      reply?.pic ||
                                      "/images/sandsharks-rainbow-icon.svg"
                                    }
                                    alt={reply?.name}
                                    fill={true}
                                    className="absolute top-0 left-0 object-cover object-center"
                                  />
                                </div>
                              </div>
                              <div className="text-center mt-1 text-xs">
                                {reply?.name}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    {new Date(post.date) > new Date() &&
                      (post?.beginnerClinic?.beginnerClinicReplies?.length >=
                      10 ? (
                        <p>
                          The maximum number of participants is 10. This clinic
                          is full, check back later to see if there's space
                          available
                        </p>
                      ) : (
                        <form
                          action={async () => {
                            "use server";
                            await replyToBeginnerClinic(post._id);
                          }}
                        >
                          <button type="submit" className="btn">
                            {post?.beginnerClinic?.beginnerClinicReplies?.some(
                              (reply) => reply.email === user?.email
                            )
                              ? "I can't make it anymore :("
                              : "Yas, plz help me! D:"}
                          </button>
                        </form>
                      ))}
                  </div>
                ) : (
                  <div className="m-4 pb-4">
                    <h1>
                      *Note: There will not be a beginner clinic offered on this
                      day.
                    </h1>
                  </div>
                ))}
            </div>
          );
        })}
      </ul>
    </div>
  );
};

export default Posts;
