// import { Request, Response } from "express";

// export const sendByAdminAlert = async (req: Request, res: Response) => {
//     try {
//         const { message, type, managerId } = req.body;
//         if (!message) {
//             return res.status(400).json({ message: "Message is required" });
//         }
//         if (managerId) {
//             global.io.to(`manager:${managerId}`).emit("receive-alert", {
//                 message,
//                 type: type || "info"
//             })
//             return res.json({ success: true, sentTo: managerId });
//         }
//         // Emit to all managers
//         global.io.to("managers").emit("receive-alert", {
//             message,
//             type: type || "info"
//         });

//         return res.json({ success: true, sentTo: "all-managers" });

//     }
//     catch (err) {
//         console.error("Admin alert error:", err);
//         return res.status(500).json({ message: "Internal error" });
//     }
// }