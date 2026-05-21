const PDFDocument = require("pdfkit");

exports.generatePrescriptionPdf = (prescription, patient, doctor) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width - 100; // usable width
    const primaryColor = "#2563eb";
    const inkColor = "#0f172a";
    const softColor = "#64748b";
    const lineColor = "#e2e8f0";

    // ── Header bar ──────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill(primaryColor);

    doc
      .fillColor("#ffffff")
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("MediBook", 50, 22);

    doc
      .fillColor("rgba(255,255,255,0.75)")
      .fontSize(10)
      .font("Helvetica")
      .text("Healthcare made simple · medibook.local", 50, 52);

    doc
      .fillColor("#ffffff")
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("PRESCRIPTION", doc.page.width - 160, 35, { width: 110, align: "right" });

    // ── Prescription ID & date ───────────────────────────────────
    doc.moveDown(3);
    const topY = 110;

    doc
      .fillColor(softColor)
      .fontSize(8)
      .font("Helvetica")
      .text("PRESCRIPTION ID", 50, topY);
    doc
      .fillColor(inkColor)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`#${prescription._id.toString().slice(-10).toUpperCase()}`, 50, topY + 12);

    doc
      .fillColor(softColor)
      .fontSize(8)
      .font("Helvetica")
      .text("DATE ISSUED", 300, topY, { align: "right", width: W - 250 });
    doc
      .fillColor(inkColor)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(
        new Date(prescription.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit", month: "long", year: "numeric",
        }),
        300, topY + 12, { align: "right", width: W - 250 }
      );

    // ── Divider ──────────────────────────────────────────────────
    doc.moveTo(50, topY + 36).lineTo(50 + W, topY + 36).strokeColor(lineColor).lineWidth(1).stroke();

    // ── Doctor & Patient info ────────────────────────────────────
    const infoY = topY + 48;

    // Doctor box
    doc.rect(50, infoY, W / 2 - 8, 80).fillAndStroke("#f0f9ff", "#bae6fd");
    doc
      .fillColor(primaryColor)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("PRESCRIBING DOCTOR", 62, infoY + 10);
    doc
      .fillColor(inkColor)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(doctor.name || "—", 62, infoY + 24);
    doc
      .fillColor(softColor)
      .fontSize(9)
      .font("Helvetica")
      .text(doctor.email || "", 62, infoY + 42);

    // Patient box
    const patX = 50 + W / 2 + 8;
    doc.rect(patX, infoY, W / 2 - 8, 80).fillAndStroke("#f0fdf4", "#bbf7d0");
    doc
      .fillColor("#16a34a")
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("PATIENT", patX + 12, infoY + 10);
    doc
      .fillColor(inkColor)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(patient.name || "—", patX + 12, infoY + 24);
    doc
      .fillColor(softColor)
      .fontSize(9)
      .font("Helvetica")
      .text(patient.email || "", patX + 12, infoY + 42);
    if (patient.phone) {
      doc.text(`Ph: ${patient.phone}`, patX + 12, infoY + 56);
    }

    // ── Diagnosis ────────────────────────────────────────────────
    const diagY = infoY + 100;
    doc
      .fillColor(softColor)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("DIAGNOSIS", 50, diagY);
    doc
      .fillColor(inkColor)
      .fontSize(12)
      .font("Helvetica")
      .text(prescription.diagnosis || "Not specified", 50, diagY + 14, { width: W });

    // ── Medicines ────────────────────────────────────────────────
    const medHeaderY = diagY + 50;
    doc
      .fillColor(softColor)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("PRESCRIBED MEDICINES", 50, medHeaderY);

    // Table header
    const tableY = medHeaderY + 16;
    doc.rect(50, tableY, W, 22).fill("#f1f5f9");
    const cols = { no: 50, name: 72, dosage: 230, freq: 340, duration: 440 };

    doc.fillColor(softColor).fontSize(8).font("Helvetica-Bold");
    doc.text("#", cols.no + 4, tableY + 7);
    doc.text("MEDICINE", cols.name, tableY + 7);
    doc.text("DOSAGE", cols.dosage, tableY + 7);
    doc.text("FREQUENCY", cols.freq, tableY + 7);
    doc.text("DURATION", cols.duration, tableY + 7);

    // Table rows
    const medicines = prescription.medicines || [];
    if (medicines.length === 0) {
      doc
        .fillColor(softColor)
        .fontSize(10)
        .font("Helvetica")
        .text("No medicines prescribed.", 50, tableY + 30);
    } else {
      medicines.forEach((m, i) => {
        const rowY = tableY + 22 + i * 28;
        if (i % 2 === 0) {
          doc.rect(50, rowY, W, 28).fill("#ffffff");
        } else {
          doc.rect(50, rowY, W, 28).fill("#f8fafc");
        }
        doc.fillColor(inkColor).fontSize(10).font("Helvetica");
        doc.text(`${i + 1}`, cols.no + 4, rowY + 9);
        doc.font("Helvetica-Bold").text(m.name || "—", cols.name, rowY + 9, { width: 150 });
        doc.font("Helvetica").text(m.dosage || "—", cols.dosage, rowY + 9, { width: 100 });
        doc.text(m.frequency || "—", cols.freq, rowY + 9, { width: 95 });
        doc.text(m.duration || "—", cols.duration, rowY + 9, { width: 95 });
      });
    }

    // ── Notes ────────────────────────────────────────────────────
    if (prescription.notes) {
      const notesY = tableY + 22 + Math.max(medicines.length, 1) * 28 + 20;
      doc
        .fillColor(softColor)
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("NOTES", 50, notesY);
      doc
        .rect(50, notesY + 14, W, Math.max(40, prescription.notes.length / 2))
        .fill("#fffbeb");
      doc
        .fillColor(inkColor)
        .fontSize(10)
        .font("Helvetica")
        .text(prescription.notes, 62, notesY + 22, { width: W - 24 });
    }

    // ── Footer ───────────────────────────────────────────────────
    const footerY = doc.page.height - 70;
    doc.moveTo(50, footerY).lineTo(50 + W, footerY).strokeColor(lineColor).lineWidth(1).stroke();

    doc
      .fillColor(softColor)
      .fontSize(8)
      .font("Helvetica")
      .text(
        "This prescription was generated digitally by MediBook. Valid only when issued by a registered doctor.",
        50, footerY + 10, { width: W, align: "center" }
      );

    // Doctor signature line
    doc
      .moveTo(50 + W - 160, footerY + 35)
      .lineTo(50 + W, footerY + 35)
      .strokeColor("#94a3b8")
      .lineWidth(0.5)
      .stroke();
    doc
      .fillColor(softColor)
      .fontSize(8)
      .text("Doctor's Signature", 50 + W - 160, footerY + 40, { width: 160, align: "center" });

    doc.end();
  });
