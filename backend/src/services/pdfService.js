const PDFDocument = require("pdfkit");

exports.generatePrescriptionPdf = (prescription, patient, doctor) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("MediBook Prescription", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Patient: ${patient.name}`);
    doc.text(`Doctor: ${doctor.name}`);
    doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`);
    doc.moveDown();
    doc.text(`Diagnosis: ${prescription.diagnosis || "N/A"}`);
    doc.moveDown();
    doc.text("Medicines:");
    prescription.medicines.forEach((m, i) => {
      doc.text(
        `${i + 1}. ${m.name} — ${m.dosage}, ${m.frequency}, ${m.duration}`
      );
    });
    if (prescription.notes) {
      doc.moveDown();
      doc.text(`Notes: ${prescription.notes}`);
    }
    doc.end();
  });
