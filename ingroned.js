// export const confirmPayment = async (paymentId, userId) => {
//   const payment = await Payment.findById(paymentId).populate({
//     path: "booking",
//     select: "status scheduledDate location totalAmount",
//     populate: [
//       {
//         path: "service",
//         select: "name category",
//       },
//     ],
//   });
//
//   if (!payment) throw new Error("Payment not found");
//   if (payment.user.toString() !== userId.toString())
//     throw new Error("Unauthorized");
//
//   if (payment.paymentMethod === "instapay") {
//     if (!payment.aiVerificationResult?.rawResponse)
//       throw new Error("Please upload your InstaPay receipt first");
//     payment.status = "pending_verification";
//
//     await notifyPaymentPendingVerification(
//       payment.user,
//       {
//         paymentId: payment._id.toString(),
//         bookingId: payment.booking._id.toString(),
//       },
//       { amount: payment.amount, serviceName: payment.booking.service.name },
//     );
//   } else if (payment.paymentMethod === "card") {
//     payment.status = "paid";
//     await _releasePaymentToWorker(payment);
//   } else if (payment.paymentMethod === "cash") {
//     payment.status = "paid";
//     await _deductCashCommissionFromWorker(payment);
//   }
//   await notifyPaymentReceived(
//     payment.user,
//     {
//       paymentId: payment._id.toString(),
//       bookingId: payment.booking.toString(),
//     },
//     { amount: payment.amount, serviceName: payment.booking.service.name },
//   );
//   await payment.save();
//   return payment;
// };
