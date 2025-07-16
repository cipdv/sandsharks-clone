"use client";

import { useState, useEffect } from "react";
import { queuePlayDayAnnouncement, getEmailJobStatus } from "@/app/_actions.js";

export default function SendAnnouncementForm({ playDays }) {
  const [selectedPlayDay, setSelectedPlayDay] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Poll job status if we have a job ID
  useEffect(() => {
    if (!jobId) return;

    const pollStatus = async () => {
      const status = await getEmailJobStatus(jobId);
      if (status.success) {
        setJobStatus(status.job);

        // Stop polling if job is completed or failed
        if (
          status.job.status === "completed" ||
          status.job.status === "failed"
        ) {
          setJobId(null);
        }
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollStatus, 5000);
    pollStatus(); // Initial check

    return () => clearInterval(interval);
  }, [jobId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPlayDay) {
      setResult({ success: false, message: "Please select a play day" });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setJobStatus(null);

    try {
      const response = await queuePlayDayAnnouncement(
        selectedPlayDay,
        customMessage
      );
      setResult(response);

      if (response.success) {
        setCustomMessage("");
        setJobId(response.jobId);
      }
    } catch (error) {
      setResult({
        success: false,
        message: "An error occurred while queueing the announcement",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to manually trigger job processing
  const handleProcessJobs = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/process-email-jobs", {
        method: "POST",
      });
      const data = await response.json();
      console.log("Job processing result:", data);

      // Refresh job status after processing
      if (jobId) {
        const status = await getEmailJobStatus(jobId);
        if (status.success) {
          setJobStatus(status.job);
        }
      }
    } catch (error) {
      console.error("Error processing jobs:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="playDay"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Play Day
          </label>
          <select
            id="playDay"
            value={selectedPlayDay}
            onChange={(e) => setSelectedPlayDay(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Choose a play day...</option>
            {playDays.map((playDay) => (
              <option key={playDay.id} value={playDay.id}>
                {playDay.title} - {formatDate(playDay.date)} at{" "}
                {formatTime(playDay.start_time)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="customMessage"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Additional Message (Optional)
          </label>
          <textarea
            id="customMessage"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any additional information about this play day..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Queueing..." : "Send Announcement"}
        </button>
      </form>

      {result && (
        <div
          className={`p-4 rounded-md ${
            result.success
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          <p>{result.message}</p>
        </div>
      )}

      {jobStatus && (
        <div className="p-4 bg-blue-50 text-blue-800 rounded-md">
          <h3 className="font-medium mb-2">Email Job Status</h3>
          <p>
            <strong>Status:</strong> {jobStatus.status}
          </p>
          {jobStatus.success_count > 0 && (
            <p>
              <strong>Emails Sent:</strong> {jobStatus.success_count}
            </p>
          )}
          {jobStatus.failure_count > 0 && (
            <p>
              <strong>Failed:</strong> {jobStatus.failure_count}
            </p>
          )}
          {jobStatus.status === "processing" && (
            <p className="text-sm mt-2">⏳ Sending emails in progress...</p>
          )}
          {jobStatus.status === "completed" && (
            <p className="text-sm mt-2">✅ All emails sent successfully!</p>
          )}

          {/* Add manual trigger button when job is queued */}
          {jobStatus.status === "queued" && (
            <div className="mt-4">
              <button
                onClick={handleProcessJobs}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing
                  ? "Processing..."
                  : "Process Job Now (Manual Trigger)"}
              </button>
              <p className="text-sm mt-2 text-blue-600">
                💡 Click this button to manually process the queued email job
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// "use client";

// import { useState, useEffect } from "react";
// import { queuePlayDayAnnouncement, getEmailJobStatus } from "@/app/_actions.js";

// export default function SendAnnouncementForm({ playDays }) {
//   const [selectedPlayDay, setSelectedPlayDay] = useState("");
//   const [customMessage, setCustomMessage] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [jobId, setJobId] = useState(null);
//   const [jobStatus, setJobStatus] = useState(null);

//   // Poll job status if we have a job ID
//   useEffect(() => {
//     if (!jobId) return;

//     const pollStatus = async () => {
//       const status = await getEmailJobStatus(jobId);
//       if (status.success) {
//         setJobStatus(status.job);

//         // Stop polling if job is completed or failed
//         if (
//           status.job.status === "completed" ||
//           status.job.status === "failed"
//         ) {
//           setJobId(null);
//         }
//       }
//     };

//     // Poll every 10 seconds
//     const interval = setInterval(pollStatus, 10000);
//     pollStatus(); // Initial check

//     return () => clearInterval(interval);
//   }, [jobId]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!selectedPlayDay) {
//       setResult({ success: false, message: "Please select a play day" });
//       return;
//     }

//     setIsLoading(true);
//     setResult(null);
//     setJobStatus(null);

//     try {
//       const response = await queuePlayDayAnnouncement(
//         selectedPlayDay,
//         customMessage
//       );
//       setResult(response);

//       if (response.success) {
//         setCustomMessage("");
//         setJobId(response.jobId);
//       }
//     } catch (error) {
//       setResult({
//         success: false,
//         message: "An error occurred while queueing the announcement",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString("en-US", {
//       weekday: "long",
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//   };

//   const formatTime = (timeString) => {
//     const [hours, minutes] = timeString.split(":");
//     const hour = Number.parseInt(hours);
//     const ampm = hour >= 12 ? "PM" : "AM";
//     const displayHour = hour % 12 || 12;
//     return `${displayHour}:${minutes} ${ampm}`;
//   };

//   return (
//     <div className="space-y-6">
//       <form onSubmit={handleSubmit} className="space-y-6">
//         <div>
//           <label
//             htmlFor="playDay"
//             className="block text-sm font-medium text-gray-700 mb-2"
//           >
//             Select Play Day
//           </label>
//           <select
//             id="playDay"
//             value={selectedPlayDay}
//             onChange={(e) => setSelectedPlayDay(e.target.value)}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//             required
//           >
//             <option value="">Choose a play day...</option>
//             {playDays.map((playDay) => (
//               <option key={playDay.id} value={playDay.id}>
//                 {playDay.title} - {formatDate(playDay.date)} at{" "}
//                 {formatTime(playDay.start_time)}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div>
//           <label
//             htmlFor="customMessage"
//             className="block text-sm font-medium text-gray-700 mb-2"
//           >
//             Additional Message (Optional)
//           </label>
//           <textarea
//             id="customMessage"
//             value={customMessage}
//             onChange={(e) => setCustomMessage(e.target.value)}
//             rows={4}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//             placeholder="Add any additional information about this play day..."
//           />
//         </div>

//         <button
//           type="submit"
//           disabled={isLoading}
//           className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {isLoading ? "Queueing..." : "Send Announcement"}
//         </button>
//       </form>

//       {result && (
//         <div
//           className={`p-4 rounded-md ${
//             result.success
//               ? "bg-green-50 text-green-800"
//               : "bg-red-50 text-red-800"
//           }`}
//         >
//           <p>{result.message}</p>
//         </div>
//       )}

//       {jobStatus && (
//         <div className="p-4 bg-blue-50 text-blue-800 rounded-md">
//           <h3 className="font-medium mb-2">📧 Email Job Status</h3>
//           <div className="space-y-1">
//             <p>
//               <strong>Status:</strong>{" "}
//               <span
//                 className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
//                   jobStatus.status === "completed"
//                     ? "bg-green-100 text-green-800"
//                     : jobStatus.status === "processing"
//                     ? "bg-yellow-100 text-yellow-800"
//                     : jobStatus.status === "failed"
//                     ? "bg-red-100 text-red-800"
//                     : "bg-gray-100 text-gray-800"
//                 }`}
//               >
//                 {jobStatus.status}
//               </span>
//             </p>
//             {jobStatus.success_count > 0 && (
//               <p>
//                 <strong>✅ Emails Sent:</strong> {jobStatus.success_count}
//               </p>
//             )}
//             {jobStatus.failure_count > 0 && (
//               <p>
//                 <strong>❌ Failed:</strong> {jobStatus.failure_count}
//               </p>
//             )}
//             {jobStatus.status === "processing" && (
//               <p className="text-sm mt-2 flex items-center">
//                 <span className="animate-spin mr-2">⏳</span>
//                 Sending emails in progress... (this may take several minutes)
//               </p>
//             )}
//             {jobStatus.status === "completed" && (
//               <p className="text-sm mt-2">🎉 All emails sent successfully!</p>
//             )}
//             {jobStatus.status === "failed" && jobStatus.error_message && (
//               <p className="text-sm mt-2 text-red-600">
//                 <strong>Error:</strong> {jobStatus.error_message}
//               </p>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
