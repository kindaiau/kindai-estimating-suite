/**
 * GetGas Seed Router
 * Seeds real GetGas materials (from Reece/ServiceM8) and job templates
 * into the platform database for the owner account.
 * Route: trpc.getgasSeed.seedMaterials (admin/owner only)
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { requireDatabase } from "../_core/errors";
import { getDb } from "../db";
import { materials, jobTemplates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { ENV } from "../_core/env";

// ─── Real GetGas materials from Reece/ServiceM8 ──────────────────────────────
const GETGAS_MATERIALS = [
  // Duopex Yellow Gas Pipe
  { name: "DUOPEX GAS PIPE 15MM BAR 5MTR", unit: "LEN", unitPrice: "32.50", category: "Gas Pipe", supplier: "Reece" },
  { name: "DUOPEX GAS PIPE 20MM BAR 5MTR", unit: "LEN", unitPrice: "40.01", category: "Gas Pipe", supplier: "Reece" },
  { name: "DUOPEX GAS PIPE 26MM BAR 5MTR", unit: "LEN", unitPrice: "60.83", category: "Gas Pipe", supplier: "Reece" },
  { name: "DUOPEX GAS PIPE 32MM BAR 5MTR", unit: "LEN", unitPrice: "85.57", category: "Gas Pipe", supplier: "Reece" },
  // Flex Hoses
  { name: "FLEX HOSE 20MM GAS (3/4\" MXF) 600MM", unit: "EA", unitPrice: "60.65", category: "Flex Hose", supplier: "Reece" },
  { name: "FLEX HOSE 20MM GAS (3/4\" MXF) 900MM", unit: "EA", unitPrice: "66.75", category: "Flex Hose", supplier: "Reece" },
  { name: "FLEX HOSE 20MM GAS (3/4\" MXF) 1200MM", unit: "EA", unitPrice: "72.50", category: "Flex Hose", supplier: "Reece" },
  { name: "DURA FLEX HOSE 10MM GAS (1/2\"MXF) 450MM", unit: "EA", unitPrice: "23.22", category: "Flex Hose", supplier: "Reece" },
  { name: "DURA FLEX HOSE 10MM GAS (1/2\"MXF) 600MM", unit: "EA", unitPrice: "26.40", category: "Flex Hose", supplier: "Reece" },
  // B-Press Gas Fittings
  { name: "B-PRESS GAS STR CONNECTOR 15MM", unit: "EA", unitPrice: "10.80", category: "B-Press Fittings", supplier: "Reece" },
  { name: "B-PRESS GAS STR CONNECTOR 20MM", unit: "EA", unitPrice: "14.04", category: "B-Press Fittings", supplier: "Reece" },
  { name: "B-PRESS GAS STR CONNECTOR 26MM", unit: "EA", unitPrice: "18.70", category: "B-Press Fittings", supplier: "Reece" },
  { name: "B-PRESS GAS ELBOW 90DEG X 15MM", unit: "EA", unitPrice: "13.45", category: "B-Press Fittings", supplier: "Reece" },
  { name: "B-PRESS GAS ELBOW 90DEG X 20MM", unit: "EA", unitPrice: "16.98", category: "B-Press Fittings", supplier: "Reece" },
  { name: "B-PRESS GAS TEE 15MM", unit: "EA", unitPrice: "16.20", category: "B-Press Fittings", supplier: "Reece" },
  { name: "B-PRESS GAS TEE 20MM", unit: "EA", unitPrice: "20.45", category: "B-Press Fittings", supplier: "Reece" },
  { name: "B-PRESS GAS REDUCER 20X15MM", unit: "EA", unitPrice: "12.30", category: "B-Press Fittings", supplier: "Reece" },
  // Duopex Crimp Fittings
  { name: "DUOPEX GAS CRIMP STRAIGHT FITTING 20MM", unit: "EA", unitPrice: "8.80", category: "Crimp Fittings", supplier: "Reece" },
  { name: "DUOPEX GAS CRIMP ELBOW 20MM", unit: "EA", unitPrice: "9.99", category: "Crimp Fittings", supplier: "Reece" },
  { name: "DUOPEX GAS CRIMP TEE 20MM", unit: "EA", unitPrice: "15.27", category: "Crimp Fittings", supplier: "Reece" },
  { name: "DUOPEX GAS CRIMP REDUCER 20X15MM", unit: "EA", unitPrice: "7.50", category: "Crimp Fittings", supplier: "Reece" },
  // PE Gas Pipe (Inground)
  { name: "PE GAS PIPE Y/S SDR11 PE100 25MM X 7M", unit: "LEN", unitPrice: "38.50", category: "PE Gas Pipe", supplier: "Reece" },
  { name: "PE GAS PIPE Y/S SDR11 PE100 32MM X 7M", unit: "LEN", unitPrice: "52.80", category: "PE Gas Pipe", supplier: "Reece" },
  { name: "PE GAS PIPE Y/S SDR11 PE100 50MM X 7M", unit: "LEN", unitPrice: "69.30", category: "PE Gas Pipe", supplier: "Reece" },
  { name: "PE GAS PIPE Y/S SDR11 PE100 63MM X 7M", unit: "LEN", unitPrice: "95.70", category: "PE Gas Pipe", supplier: "Reece" },
  // Friatec EF Fittings
  { name: "FRIATEC EF COUPLER 25MM", unit: "EA", unitPrice: "28.50", category: "EF Fittings", supplier: "Reece" },
  { name: "FRIATEC EF COUPLER 32MM", unit: "EA", unitPrice: "35.20", category: "EF Fittings", supplier: "Reece" },
  { name: "FRIATEC EF ELBOW 90DEG 25MM", unit: "EA", unitPrice: "42.80", category: "EF Fittings", supplier: "Reece" },
  { name: "FRIATEC EF TEE 25MM", unit: "EA", unitPrice: "55.60", category: "EF Fittings", supplier: "Reece" },
  // Valves & Regulators
  { name: "ARCO COMBI VALVE 20MM", unit: "EA", unitPrice: "38.30", category: "Valves", supplier: "Reece" },
  { name: "BALL VALVE GAS 20MM", unit: "EA", unitPrice: "28.50", category: "Valves", supplier: "Reece" },
  { name: "BALL VALVE GAS 25MM", unit: "EA", unitPrice: "35.80", category: "Valves", supplier: "Reece" },
  { name: "GAS METER COCK 20MM", unit: "EA", unitPrice: "45.20", category: "Valves", supplier: "Reece" },
  { name: "LPG REGULATOR 1.1KPA", unit: "EA", unitPrice: "65.00", category: "Regulators", supplier: "Reece" },
  { name: "LPG REGULATOR 2.75KPA", unit: "EA", unitPrice: "78.50", category: "Regulators", supplier: "Reece" },
  { name: "LPG TWIN STAGE REGULATOR KIT", unit: "EA", unitPrice: "185.00", category: "Regulators", supplier: "Reece" },
  // Excess Flow Valves
  { name: "EXCESS FLOW VALVE 350MJ/H", unit: "EA", unitPrice: "285.00", category: "Safety Devices", supplier: "Reece" },
  { name: "EXCESS FLOW VALVE 580MJ/H", unit: "EA", unitPrice: "320.00", category: "Safety Devices", supplier: "Reece" },
  { name: "EXCESS FLOW VALVE 950MJ/H", unit: "EA", unitPrice: "330.00", category: "Safety Devices", supplier: "Reece" },
  // Bayonets & Outlets
  { name: "GAS BAYONET OUTLET 1/2\" BSP", unit: "EA", unitPrice: "45.00", category: "Outlets", supplier: "Reece" },
  { name: "GAS BAYONET OUTLET 3/4\" BSP", unit: "EA", unitPrice: "52.00", category: "Outlets", supplier: "Reece" },
  { name: "GAS BAYONET PLUG 1/2\"", unit: "EA", unitPrice: "8.50", category: "Outlets", supplier: "Reece" },
  // Consumables
  { name: "GAS THREAD TAPE PTFE YELLOW", unit: "ROLL", unitPrice: "4.50", category: "Consumables", supplier: "Reece" },
  { name: "GAS PIPE CLIPS 20MM (BAG 50)", unit: "BAG", unitPrice: "18.50", category: "Consumables", supplier: "Reece" },
  { name: "GAS PIPE CLIPS 26MM (BAG 50)", unit: "BAG", unitPrice: "22.00", category: "Consumables", supplier: "Reece" },
  { name: "GAS PRESSURE TEST KIT", unit: "EA", unitPrice: "85.00", category: "Testing", supplier: "Reece" },
  { name: "GAS PRESSURE GAUGE 0-100KPA", unit: "EA", unitPrice: "45.00", category: "Testing", supplier: "Reece" },
];

// ─── GetGas Job Templates ─────────────────────────────────────────────────────
const GETGAS_TEMPLATES = [
  {
    name: "1st & 2nd Fix — Single Storey (Builder Rate)",
    description: "Complete gas installation for a single storey new home. Hot plate & hot water included. Builder rate.",
    estimatedTotal: "1679.00",
    lineItems: [
      { description: "1st Fix Gas Rough-In — Single Storey", unit: "job", quantity: 1, unitRate: 900, category: "Labour" },
      { description: "2nd Fix Appliance Connections", unit: "job", quantity: 1, unitRate: 450, category: "Labour" },
      { description: "Gas Cooktop Connection (flex hose + commissioning)", unit: "ea", quantity: 1, unitRate: 126, category: "Labour" },
      { description: "Hot Water Gas Connection", unit: "ea", quantity: 1, unitRate: 110, category: "Labour" },
      { description: "Sound Test & AS/NZS 5601 Compliance Cert", unit: "job", quantity: 1, unitRate: 93, category: "Compliance" },
    ],
  },
  {
    name: "1st & 2nd Fix — Double Storey (Builder Rate)",
    description: "Complete gas installation for a double storey new home. Hot plate & hot water included. Builder rate.",
    estimatedTotal: "1886.00",
    lineItems: [
      { description: "1st Fix Gas Rough-In — Double Storey", unit: "job", quantity: 1, unitRate: 1100, category: "Labour" },
      { description: "2nd Fix Appliance Connections", unit: "job", quantity: 1, unitRate: 500, category: "Labour" },
      { description: "Gas Cooktop Connection (flex hose + commissioning)", unit: "ea", quantity: 1, unitRate: 126, category: "Labour" },
      { description: "Hot Water Gas Connection", unit: "ea", quantity: 1, unitRate: 110, category: "Labour" },
      { description: "Sound Test & AS/NZS 5601 Compliance Cert", unit: "job", quantity: 1, unitRate: 50, category: "Compliance" },
    ],
  },
  {
    name: "Standard Appliance Package — Cooktop + HWS",
    description: "Standard residential appliance package. Gas cooktop and hot water connection.",
    estimatedTotal: "206.00",
    lineItems: [
      { description: "Gas Cooktop Connection", unit: "ea", quantity: 1, unitRate: 126, category: "Labour" },
      { description: "Hot Water Gas Connection", unit: "ea", quantity: 1, unitRate: 110, category: "Labour" },
      { description: "Flex Hose 20mm 600mm", unit: "ea", quantity: 1, unitRate: 61, category: "Materials" },
    ],
  },
  {
    name: "BBQ Installation — Standard",
    description: "Standard BBQ gas connection with bayonet outlet.",
    estimatedTotal: "350.00",
    lineItems: [
      { description: "BBQ Gas Point Installation", unit: "ea", quantity: 1, unitRate: 200, category: "Labour" },
      { description: "Gas Bayonet Outlet 1/2\" BSP", unit: "ea", quantity: 1, unitRate: 45, category: "Materials" },
      { description: "DUOPEX Gas Pipe 20mm (run to BBQ)", unit: "LEN", quantity: 2, unitRate: 40, category: "Materials" },
      { description: "B-Press Fittings (assorted)", unit: "set", quantity: 1, unitRate: 65, category: "Materials" },
    ],
  },
  {
    name: "LPG Regulator Kit Setup",
    description: "LPG cylinder regulator installation and setup. Includes twin-stage regulator.",
    estimatedTotal: "601.00",
    lineItems: [
      { description: "LPG Twin Stage Regulator Kit", unit: "ea", quantity: 1, unitRate: 185, category: "Materials" },
      { description: "LPG Regulator Installation", unit: "ea", quantity: 1, unitRate: 250, category: "Labour" },
      { description: "Pressure Test & Commissioning", unit: "job", quantity: 1, unitRate: 93, category: "Compliance" },
      { description: "Compliance Documentation", unit: "job", quantity: 1, unitRate: 73, category: "Compliance" },
    ],
  },
  {
    name: "Inground Gas Pipework — Standard Run",
    description: "Underground gas pipe installation. Standard residential run up to 15m.",
    estimatedTotal: "2804.00",
    lineItems: [
      { description: "Excavation (machine)", unit: "m", quantity: 15, unitRate: 58, category: "Labour" },
      { description: "PE Gas Pipe 25mm SDR11 7m", unit: "LEN", quantity: 3, unitRate: 39, category: "Materials" },
      { description: "Friatec EF Couplers", unit: "ea", quantity: 2, unitRate: 29, category: "Materials" },
      { description: "Sand bedding & backfill", unit: "m", quantity: 15, unitRate: 25, category: "Labour" },
      { description: "Pressure Test & Compliance", unit: "job", quantity: 1, unitRate: 150, category: "Compliance" },
      { description: "Reinstatement", unit: "job", quantity: 1, unitRate: 500, category: "Labour" },
    ],
  },
];

export const getgasSeedRouter = router({
  seedMaterials: protectedProcedure
    .input(z.object({ confirm: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (!input.confirm) throw new TRPCError({ code: "BAD_REQUEST", message: "Must confirm seeding" });

      const db = requireDatabase(await getDb());

      // Only owner can seed
      if (ctx.user.openId !== ENV.ownerOpenId && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Owner only" });
      }

      const userId = ctx.user.id;
      let materialsSeeded = 0;
      let templatesSeeded = 0;

      // Seed materials into the materials table (userId null = system, or owner userId)
      for (const mat of GETGAS_MATERIALS) {
        // Check if already exists for this user
        const existing = await db
          .select({ id: materials.id })
          .from(materials)
          .where(and(eq(materials.name, mat.name), eq(materials.trade, "gas")))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(materials).values({
            userId,
            trade: "gas",
            category: mat.category,
            name: mat.name,
            unit: mat.unit,
            unitPrice: mat.unitPrice,
            supplier: mat.supplier,
            wasteFactor: "2.00",
            isActive: true,
          });
          materialsSeeded++;
        }
      }

      // Seed job templates
      for (const tmpl of GETGAS_TEMPLATES) {
        const existing = await db
          .select({ id: jobTemplates.id })
          .from(jobTemplates)
          .where(and(eq(jobTemplates.name, tmpl.name), eq(jobTemplates.userId, userId)))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(jobTemplates).values({
            userId,
            trade: "gas",
            name: tmpl.name,
            description: tmpl.description,
            lineItems: tmpl.lineItems,
            estimatedTotal: tmpl.estimatedTotal,
            isActive: true,
          });
          templatesSeeded++;
        }
      }

      return {
        success: true,
        materialsSeeded,
        templatesSeeded,
        message: `Seeded ${materialsSeeded} gas materials and ${templatesSeeded} job templates for GetGas.`,
      };
    }),

  getSeedStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    const gasMaterials = await db
      .select({ id: materials.id })
      .from(materials)
      .where(eq(materials.trade, "gas"));

    const gasTemplates = await db
      .select({ id: jobTemplates.id })
      .from(jobTemplates)
      .where(eq(jobTemplates.trade, "gas"));

    return {
      materialsCount: gasMaterials.length,
      templatesCount: gasTemplates.length,
    };
  }),
});
