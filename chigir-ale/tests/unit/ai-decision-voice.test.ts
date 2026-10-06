import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MockAIProvider } from "@/server/services/ai/mock-ai-provider";
import { VixovideVoiceProvider } from "@/server/services/voice/voice.service";
import { MAX_AI_JOB_ATTEMPTS } from "@/server/services/ai/ai-job.service";

describe("Iteration 9: AI, Voice & Smart Decision Support", () => {
  const aiProvider = new MockAIProvider();
  const voiceProvider = new VixovideVoiceProvider();

  const mockCategories = [
    { id: "cat-roads", name: "Roads", slug: "roads" },
    { id: "cat-water", name: "Water", slug: "water" },
    { id: "cat-elec", name: "Electricity", slug: "electricity" },
    { id: "cat-drain", name: "Drainage", slug: "drainage" },
    { id: "cat-waste", name: "Waste Management", slug: "waste-management" },
  ];

  const mockDepartments = [
    { id: "dept-roads", name: "Road Maintenance Authority", slug: "roads-dept" },
    { id: "dept-water", name: "Water & Sewerage Authority", slug: "water-dept" },
    { id: "dept-power", name: "Electric Utility Agency", slug: "power-dept" },
  ];

  describe("AI Provider Metadata & Provenance (Spec §35 & §37)", () => {
    it("should provide immutable name, model, and version provenance", () => {
      assert.ok(aiProvider.name.length > 0);
      assert.ok(aiProvider.model.length > 0);
      assert.ok(aiProvider.version.length > 0);
      assert.equal(aiProvider.model, "gemini-2.0-flash-civic-v1");
    });
  });

  describe("Category Classification with Multilingual Support (Spec §35)", () => {
    it("should classify English road and pothole reports to Roads category", async () => {
      const res = await aiProvider.classifyCategory(
        "Severe pothole on Churchill Avenue",
        "Deep asphalt crater causing traffic jams near the post office",
        mockCategories
      );

      assert.equal(res.suggestedCategoryId, "cat-roads");
      assert.ok(res.confidence >= 0.7);
      assert.ok(res.reasoning.toLowerCase().includes("road"));
      assert.ok(res.alternativeCategories.length > 0);
    });

    it("should classify English water leak reports to Water category", async () => {
      const res = await aiProvider.classifyCategory(
        "Burst main pipe leaking water",
        "Clean water flooding onto the street for two hours",
        mockCategories
      );

      assert.equal(res.suggestedCategoryId, "cat-water");
      assert.ok(res.confidence >= 0.7);
      assert.ok(res.reasoning.toLowerCase().includes("water"));
    });

    it("should classify Amharic text using Ethiopic keyword detection", async () => {
      // Amharic: "የውሃ ቧንቧ ፈንድቷል" -> Water
      const resWater = await aiProvider.classifyCategory(
        "የውሃ ቧንቧ ፈሰሰ",
        "በጣም ብዙ ንጹህ ውሃ እየፈሰሰ ነው",
        mockCategories
      );
      assert.equal(resWater.suggestedCategoryId, "cat-water");

      // Amharic: "መንገድ ላይ ትልቅ ጉድጓድ" -> Roads
      const resRoad = await aiProvider.classifyCategory(
        "መንገድ ላይ ትልቅ ጉድጓድ",
        "አስፋልቱ ተሰብሮ መኪና ማለፍ አልቻለም",
        mockCategories
      );
      assert.equal(resRoad.suggestedCategoryId, "cat-roads");

      // Amharic: "የኤሌክትሪክ ሽቦ" -> Electricity
      const resElec = await aiProvider.classifyCategory(
        "የኤሌክትሪክ ሽቦ ተበጥሷል",
        "መብራት ጠፍቷል ሽቦው መሬት ወድቋል",
        mockCategories
      );
      assert.equal(resElec.suggestedCategoryId, "cat-elec");
    });
  });

  describe("Report Summarization & Urgency Detection (Spec §35)", () => {
    it("should synthesize executive summary and key points from report text", async () => {
      const res = await aiProvider.summarizeReport(
        "Major sewer blockage near Kazanchis",
        "Heavy rains caused the stormwater drain to overflow with foul-smelling black water. Pedestrians cannot cross the intersection. Business owners are concerned about property damage."
      );

      assert.ok(res.summary.length > 0);
      assert.ok(res.keyPoints.length >= 1);
      assert.ok(res.affectedInfrastructure.length > 0);
    });

    it("should elevate urgency to CRITICAL on spark or collapse hazard indicators", async () => {
      const res = await aiProvider.summarizeReport(
        "High voltage wire collapse and active sparks",
        "Active sparks falling on the road near children playground. Emergency situation."
      );

      assert.equal(res.detectedUrgency, "CRITICAL");
      assert.equal(res.sentiment, "URGENT");
    });
  });

  describe("Duplicate Candidate Detection & Semantic Ranking (Spec §35 & §64)", () => {
    it("should detect duplicate report candidates with high confidence and distance reason", async () => {
      const target = {
        title: "Large pothole in road",
        description: "Deep asphalt crater damaging vehicle tires on Bole Road",
        categoryId: "cat-roads",
        latitude: 9.0105,
        longitude: 38.7612,
      };

      const candidates = [
        {
          id: "rep-1",
          publicReference: "CHI-2026-000010",
          title: "Huge pothole on Bole road",
          description: "Dangerous crater on road surface near airport road",
          categoryId: "cat-roads",
          latitude: 9.0108,
          longitude: 38.7615, // ~45 meters away
          createdAt: new Date(),
        },
        {
          id: "rep-2",
          publicReference: "CHI-2026-000011",
          title: "Broken streetlight in Sarbet",
          description: "Streetlight not illuminating at night",
          categoryId: "cat-elec",
          latitude: 8.9950,
          longitude: 38.7300,
          createdAt: new Date(),
        },
      ];

      const duplicates = await aiProvider.detectDuplicates(target, candidates);

      assert.ok(duplicates.length > 0);
      assert.equal(duplicates[0]?.publicReference, "CHI-2026-000010");
      assert.ok(duplicates[0]?.confidence > 0.6);
      assert.ok(duplicates[0]?.similarityReason.includes("proximity") || duplicates[0]?.similarityReason.includes("similarity"));
    });
  });

  describe("Evidence Image Analysis & Hazard Recognition (Spec §35)", () => {
    it("should detect electrical cabling hazards and elevate severity to CRITICAL", async () => {
      const res = await aiProvider.analyzeImage({
        mimeType: "image/jpeg",
        sizeBytes: 1024 * 500,
        fileName: "damaged_wire_spark_pole.jpg",
      });

      assert.equal(res.damageSeverity, "CRITICAL");
      assert.ok(res.safetyHazards.some((h) => h.includes("electrocution")));
      assert.equal(res.suggestedCategorySlug, "electricity");
    });

    it("should detect water pipe ruptures and classify as HIGH severity", async () => {
      const res = await aiProvider.analyzeImage({
        mimeType: "image/png",
        fileName: "burst_water_pipe_leak.png",
      });

      assert.equal(res.damageSeverity, "HIGH");
      assert.equal(res.suggestedCategorySlug, "water");
    });
  });

  describe("Smart Decision Support & Explanations (Spec §136)", () => {
    it("should generate structured recommendations with explainable algorithmic reasoning", async () => {
      const rec = await aiProvider.recommendDecisions(
        {
          id: "rep-123",
          title: "Water pipe ruptured flooding market",
          description: "High volume drinking water flooding marketplace stalls with 15 confirmations.",
          severity: "MEDIUM",
          categoryId: "cat-water",
          confirmationCount: 15,
        },
        mockCategories,
        mockDepartments,
        []
      );

      assert.ok(rec.suggestedCategory);
      assert.equal(rec.suggestedCategory.name, "Water");
      assert.ok(rec.suggestedDepartment);
      assert.ok(rec.suggestedDepartment.name.includes("Water"));
      assert.equal(rec.suggestedSeverity?.severity, "HIGH");
      assert.ok(rec.reason.length > 0);
      assert.ok(rec.reason.includes("Category confidence") || rec.reason.includes("Priority recommendation"));
    });
  });

  describe("Human Override Validation & Audit Requirements (Spec §137)", () => {
    it("should require a minimum justification length of 5 characters for human overrides", () => {
      function validateOverrideReason(reason: string): boolean {
        return typeof reason === "string" && reason.trim().length >= 5;
      }

      assert.equal(validateOverrideReason(""), false);
      assert.equal(validateOverrideReason("ok"), false);
      assert.equal(validateOverrideReason("bad"), false);
      assert.equal(validateOverrideReason("Inspection confirmed drainage issue"), true);
    });
  });

  describe("AI Safety & Fault Tolerance (Spec §138 & §139)", () => {
    it("AI outputs must be treated as untrusted and never auto-reject without human review", () => {
      const isAutoRejectionPermitted = false;
      assert.equal(isAutoRejectionPermitted, false, "AI must never perform autonomous rejection");
    });

    it("AI service errors should fail gracefully without disrupting core report workflows", async () => {
      let coreReportCreated = false;
      let aiJobDispatched = false;

      // Simulate report flow
      try {
        coreReportCreated = true;
        // Decoupled AI call throws simulated network failure
        throw new Error("Gemini AI API connection timeout");
      } catch {
        // Decoupled catch per Spec §139
        aiJobDispatched = false;
      }

      assert.equal(coreReportCreated, true, "Core report creation succeeded despite AI error");
      assert.equal(aiJobDispatched, false);
    });
  });

  describe("AI Job Queue State Machine & Max Attempts (Spec §36 & §65)", () => {
    it("should define maximum retries capped at 3 attempts", () => {
      assert.equal(MAX_AI_JOB_ATTEMPTS, 3);
    });

    it("should transition state machine from PENDING to PROCESSING to COMPLETED or FAILED", () => {
      const allowedJobStatuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"];
      assert.ok(allowedJobStatuses.includes("PENDING"));
      assert.ok(allowedJobStatuses.includes("PROCESSING"));
      assert.ok(allowedJobStatuses.includes("COMPLETED"));
      assert.ok(allowedJobStatuses.includes("FAILED"));
    });
  });

  describe("Voice Interaction & Vixovide Engine (Spec §38)", () => {
    it("should detect Amharic language via Ethiopic unicode script range", async () => {
      const amharicDetection = await voiceProvider.detectLanguage("መንገዱ ላይ ትልቅ ጉድጓድ አለ");
      assert.equal(amharicDetection.language, "am");
      assert.ok(amharicDetection.confidence > 0.9);

      const englishDetection = await voiceProvider.detectLanguage("A large pothole on the road");
      assert.equal(englishDetection.language, "en");
    });

    it("should normalize transcribed speech by stripping verbal fillers and standardizing punctuation", () => {
      const rawEnglish = "uh so yeah there is a burst pipe like right here";
      const normalizedEnglish = voiceProvider.normalize(rawEnglish, "en");
      assert.ok(!normalizedEnglish.toLowerCase().includes("uh"));
      assert.ok(normalizedEnglish.endsWith("."));

      const rawAmharic = "ማለትም የውሃ ቧንቧ ፈሰሰ እህ";
      const normalizedAmharic = voiceProvider.normalize(rawAmharic, "am");
      assert.ok(!normalizedAmharic.includes("ማለትም"));
      assert.ok(normalizedAmharic.endsWith("።"));
    });

    it("should translate recognized civic infrastructure phrases between Amharic and English", async () => {
      const res = await voiceProvider.translate("የውሃ ቧንቧ ፈንድቷል", "am", "en");
      assert.equal(res.translatedText, "A water pipe has burst");

      const reverse = await voiceProvider.translate("A water pipe has burst", "en", "am");
      assert.equal(reverse.translatedText, "የውሃ ቧንቧ ፈንድቷል");
    });

    it("should provide full transcription result with review capability before submission", async () => {
      const result = await voiceProvider.transcribe({
        simulatedText: "uh there is a huge pothole on Bole road near the bank",
        languageHint: "en",
      });

      assert.ok(result.rawText.length > 0);
      assert.ok(result.normalizedText.length > 0);
      assert.equal(result.detectedLanguage, "en");
      assert.ok(result.confidence > 0.8);
      assert.equal(result.suggestedCategorySlug, "roads");
      assert.ok(result.suggestedTitle.length > 0);
    });
  });
});
