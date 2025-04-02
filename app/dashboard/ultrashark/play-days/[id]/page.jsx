// import Link from "next/link";
// import { getPlayDayById } from "@/app/lib/data";
// import { formatDate, formatTime } from "@/app/lib/utils";
// import CommentForm from "@/components/comment-form";
// import ClinicRegistration from "@/components/clinic-registration";
// import AddUpdateForm from "@/components/add-update-form";

// // This is a placeholder - in a real app, you'd get the user from the session
// const getCurrentUser = async () => {
//   // For demo purposes, return a fixed user
//   return {
//     id: 1,
//     memberType: "ultrashark",
//   };
// };

// export default async function PlayDayPage({ params }) {
//   const playDay = await getPlayDayById(params.id);
//   const user = await getCurrentUser();
//   const isAdmin = user?.memberType === "ultrashark";

//   if (!playDay) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <h1 className="text-2xl font-bold mb-4">Play Day Not Found</h1>
//         <p>
//           The play day you're looking for doesn't exist or has been removed.
//         </p>
//         <Link
//           href="/"
//           className="text-blue-600 hover:underline mt-4 inline-block"
//         >
//           Back to Home
//         </Link>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <Link
//         href="/"
//         className="text-blue-600 hover:underline mb-4 inline-block"
//       >
//         &larr; Back to Home
//       </Link>

//       <div className="bg-white rounded-lg shadow-md overflow-hidden">
//         <div className="bg-blue-600 text-white p-6">
//           <h1 className="text-3xl font-bold mb-2">{playDay.title}</h1>
//           <p className="text-xl">{formatDate(playDay.date)}</p>
//         </div>

//         <div className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <h3 className="font-semibold text-lg mb-2">Details</h3>
//               <p>
//                 <span className="font-medium">Time:</span>{" "}
//                 {formatTime(playDay.start_time)} -{" "}
//                 {formatTime(playDay.end_time)}
//               </p>
//               <p>
//                 <span className="font-medium">Location:</span>{" "}
//                 {playDay.home_court}
//               </p>
//               <p>
//                 <span className="font-medium">RSVPs:</span> {playDay.rsvp_count}
//               </p>
//             </div>

//             <div className="bg-gray-50 p-4 rounded-lg">
//               <h3 className="font-semibold text-lg mb-2">Volunteers</h3>
//               {playDay.main_volunteer ? (
//                 <p>
//                   <span className="font-medium">Main:</span>{" "}
//                   {playDay.main_volunteer.name}
//                 </p>
//               ) : (
//                 <p>
//                   <span className="font-medium">Main:</span>{" "}
//                   <span className="text-gray-500">Needed</span>
//                 </p>
//               )}

//               {playDay.helper_volunteer ? (
//                 <p>
//                   <span className="font-medium">Helper:</span>{" "}
//                   {playDay.helper_volunteer.name}
//                 </p>
//               ) : (
//                 <p>
//                   <span className="font-medium">Helper:</span>{" "}
//                   <span className="text-gray-500">Needed</span>
//                 </p>
//               )}
//             </div>

//             {playDay.clinic ? (
//               <div className="bg-yellow-50 p-4 rounded-lg">
//                 <h3 className="font-semibold text-lg mb-2">Beginner Clinic</h3>
//                 <p>
//                   <span className="font-medium">Time:</span>{" "}
//                   {formatTime(playDay.clinic.start_time)} -{" "}
//                   {formatTime(playDay.clinic.end_time)}
//                 </p>
//                 {playDay.clinic.description && (
//                   <p className="mt-2 text-sm">{playDay.clinic.description}</p>
//                 )}
//                 <ClinicRegistration clinicId={playDay.clinic.id} />
//               </div>
//             ) : null}
//           </div>

//           <div className="mb-8">
//             <h2 className="text-2xl font-semibold mb-4">About This Play Day</h2>
//             <div className="prose max-w-none">
//               {playDay.content || (
//                 <p className="text-gray-500">No description available.</p>
//               )}
//             </div>
//           </div>

//           {isAdmin && <AddUpdateForm postId={playDay.id} />}

//           {playDay.updates && playDay.updates.length > 0 && (
//             <div className="mb-8">
//               <h2 className="text-2xl font-semibold mb-4">Updates</h2>
//               <div className="space-y-4">
//                 {playDay.updates.map((update) => (
//                   <div key={update.id} className="bg-blue-50 p-4 rounded-lg">
//                     <p>{update.content}</p>
//                     <p className="text-sm text-gray-500 mt-2">
//                       {new Date(update.created_at).toLocaleString()}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           <div>
//             <h2 className="text-2xl font-semibold mb-4">Comments</h2>
//             <CommentForm playDayId={playDay.id} />

//             {playDay.comments && playDay.comments.length > 0 ? (
//               <div className="space-y-4 mt-6">
//                 {playDay.comments.map((comment) => (
//                   <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
//                     <div className="flex items-center mb-2">
//                       <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 overflow-hidden">
//                         {comment.user.profile_pic_url ? (
//                           <img
//                             src={
//                               comment.user.profile_pic_url || "/placeholder.svg"
//                             }
//                             alt={comment.user.name}
//                             className="w-full h-full object-cover"
//                           />
//                         ) : null}
//                       </div>
//                       <div>
//                         <p className="font-medium">{comment.user.name}</p>
//                         <p className="text-xs text-gray-500">
//                           {new Date(comment.created_at).toLocaleString()}
//                         </p>
//                       </div>
//                     </div>
//                     <p>{comment.content}</p>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-gray-500">
//                 No comments yet. Be the first to comment!
//               </p>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
