"use client";

import { useState } from "react";
import { submitSurvey } from "@/app/_actions";
import { useActionState } from "react";

export default function SurveyPage() {
  const [formData, setFormData] = useState({
    email: "",
    feedback: "",
    fridayEvenings: false,
    saturdays: false,
    sundays: false,
    saturdayStartTime: "9:00",
    saturdayEndTime: "17:00",
    sundayStartTime: "9:00",
    sundayEndTime: "17:00",
    merchandise: {
      hat: false,
      tankTop: false,
      tShirt: false,
      other: false,
      otherIdea: "",
    },
  });

  const [state, action, isPending] = useActionState(submitSurvey, null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("merchandise.")) {
      const merchandiseField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        merchandise: {
          ...prev.merchandise,
          [merchandiseField]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formDataToSubmit = new FormData();

    // Add all form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "merchandise") {
        Object.entries(value).forEach(([merchKey, merchValue]) => {
          formDataToSubmit.append(`merchandise.${merchKey}`, merchValue);
        });
      } else {
        formDataToSubmit.append(key, value);
      }
    });

    action(formDataToSubmit);
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 9; hour <= 17; hour++) {
      const timeString = `${hour.toString().padStart(2, "0")}:00`;
      const displayTime = hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
      if (hour === 12) {
        options.push(
          <option key={timeString} value={timeString}>
            12:00 PM
          </option>
        );
      } else {
        options.push(
          <option key={timeString} value={timeString}>
            {displayTime}
          </option>
        );
      }
    }
    return options;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="bg-blue-100 p-4 rounded-md mt-6 w-full lg:w-2/5 mx-auto">
        <h1 className="text-2xl font-bold mb-6">2025 Season Survey</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Feedback Textarea */}
          <div>
            <label
              htmlFor="feedback"
              className="block text-sm font-medium mb-1"
            >
              Do you have any feedback from the 2025 season or ideas of how we
              can make the 2026 season even better?
            </label>
            <textarea
              id="feedback"
              name="feedback"
              value={formData.feedback}
              onChange={handleChange}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Share your thoughts and suggestions..."
            />
          </div>

          {/* Days Preference */}
          <div>
            <h3 className="text-lg font-medium mb-3">
              I will be requesting permits for the 2026 season, which days would
              you want to play next year?
            </h3>

            <div className="space-y-3">
              {/* Friday Evenings */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="fridayEvenings"
                  checked={formData.fridayEvenings}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span>Friday evenings</span>
              </label>

              {/* Saturdays with time slider */}
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    name="saturdays"
                    checked={formData.saturdays}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Saturdays</span>
                </label>

                {formData.saturdays && (
                  <div className="ml-6 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">Start Time</label>
                      <select
                        name="saturdayStartTime"
                        value={formData.saturdayStartTime}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {generateTimeOptions()}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">End Time</label>
                      <select
                        name="saturdayEndTime"
                        value={formData.saturdayEndTime}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {generateTimeOptions()}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Sundays with time slider */}
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    name="sundays"
                    checked={formData.sundays}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Sundays</span>
                </label>

                {formData.sundays && (
                  <div className="ml-6 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">Start Time</label>
                      <select
                        name="sundayStartTime"
                        value={formData.sundayStartTime}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {generateTimeOptions()}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">End Time</label>
                      <select
                        name="sundayEndTime"
                        value={formData.sundayEndTime}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {generateTimeOptions()}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Merchandise Interest */}
          <div>
            <h3 className="text-lg font-medium mb-3">
              Would you be interested in purchasing Sandsharks merchandise? If
              so, what:
            </h3>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="merchandise.hat"
                  checked={formData.merchandise.hat}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span>Hat</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="merchandise.tankTop"
                  checked={formData.merchandise.tankTop}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span>Tank-top</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="merchandise.tShirt"
                  checked={formData.merchandise.tShirt}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span>T-shirt</span>
              </label>

              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    name="merchandise.other"
                    checked={formData.merchandise.other}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Other</span>
                </label>

                {formData.merchandise.other && (
                  <input
                    type="text"
                    name="merchandise.otherIdea"
                    value={formData.merchandise.otherIdea}
                    onChange={handleChange}
                    placeholder="Please specify..."
                    className="w-full p-2 border border-gray-300 rounded-md ml-6"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 disabled:bg-gray-400 font-medium"
          >
            {isPending ? "Submitting..." : "Submit Survey"}
          </button>

          {/* Display Messages */}
          {state && (
            <div
              className={`p-3 rounded-md ${
                state.success
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {state.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// "use client";

// import React, { useState } from "react";
// import { submitSurvey } from "@/app/_actions";

// const SurveyPage = () => {
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     permits: "",
//     volunteer: "",
//     comments: "",
//     feeDeterrent: "", // New state for the additional question
//   });

//   const [isSubmitted, setIsSubmitted] = useState(false);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     console.log("Form submitted:", formData);
//     try {
//       await submitSurvey(formData);
//       setIsSubmitted(true);
//     } catch (error) {
//       console.error("Error submitting survey:", error);
//     }
//   };

//   return (
//     <div className="p-6 space-y-6 max-w-lg mx-auto">
//       <h1 className="text-2xl font-bold mb-4">Sandsharks 2025 Season Survey</h1>
//       {isSubmitted ? (
//         <h2 className="text-xl font-bold mb-4">
//           Thanks for submitting the survey :)
//         </h2>
//       ) : (
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="flex space-x-4">
//             <div className="flex-1">
//               <label className="block mb-1">First Name:</label>
//               <input
//                 type="text"
//                 name="firstName"
//                 value={formData.firstName}
//                 onChange={handleChange}
//                 required
//                 className="w-full p-2 border border-gray-300 rounded"
//               />
//             </div>
//             <div className="flex-1">
//               <label className="block mb-1">Last Name:</label>
//               <input
//                 type="text"
//                 name="lastName"
//                 value={formData.lastName}
//                 onChange={handleChange}
//                 required
//                 className="w-full p-2 border border-gray-300 rounded"
//               />
//             </div>
//           </div>
//           <div>
//             <label className="block mb-1">Email Address:</label>
//             <input
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//               className="w-full p-2 border border-gray-300 rounded"
//             />
//           </div>
//           <div>
//             <label className="block mb-1">
//               Would a one-time $25 fee for the summer discourage you from
//               playing with Sandsharks?
//             </label>
//             <select
//               name="feeDeterrent"
//               value={formData.feeDeterrent}
//               onChange={handleChange}
//               required
//               className="w-full p-2 border border-gray-300 rounded"
//             >
//               <option value="">Select an option</option>
//               <option value="Yes">Yes</option>
//               <option value="No">No</option>
//             </select>
//           </div>
//           <p className="my-4">
//             Here is a list of the dates that are available to get court permits:
//             <br />
//             <span className="block mt-2">May 17, 18, 24, 25, 31</span>
//             <span className="block mt-2">June 1, 14, 15, 28, 29</span>
//             <span className="block mt-2">July 12, 13</span>
//             <span className="block mt-2">August 23, 24, 30, 31</span>
//             <span className="block mt-2">September 1</span>
//           </p>
//           <div>
//             <label className="block mb-1">
//               Would you like me to get permits for Saturdays or Sundays, or
//               both?
//             </label>
//             <select
//               name="permits"
//               value={formData.permits}
//               onChange={handleChange}
//               required
//               className="w-full p-2 border border-gray-300 rounded"
//             >
//               <option value="">Select an option</option>
//               <option value="Saturdays">Saturdays</option>
//               <option value="Sundays">Sundays</option>
//               <option value="Both">Both</option>
//             </select>
//           </div>
//           <div>
//             <label className="block mb-1">
//               Would you be interested in learning how to volunteer to run
//               Sandsharks once or twice this season?
//             </label>
//             <select
//               name="volunteer"
//               value={formData.volunteer}
//               onChange={handleChange}
//               required
//               className="w-full p-2 border border-gray-300 rounded"
//             >
//               <option value="">Select an option</option>
//               <option value="Yes">Yes</option>
//               <option value="No">No</option>
//             </select>
//           </div>

//           <div>
//             <label className="block mb-1">
//               If you have any questions or comments, please enter them here:
//             </label>
//             <textarea
//               name="comments"
//               value={formData.comments}
//               onChange={handleChange}
//               className="w-full p-2 border border-gray-300 rounded"
//             />
//           </div>
//           <button
//             type="submit"
//             className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//           >
//             Submit
//           </button>
//         </form>
//       )}
//     </div>
//   );
// };

// export default SurveyPage;
