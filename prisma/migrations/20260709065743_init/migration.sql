-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('DUMP_TRUCK', 'TANKER', 'EXCAVATOR', 'TAXI', 'BODY_TRUCK');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('DIESEL', 'GASOLINE', 'ELECTRIC', 'HYBRID');

-- CreateTable
CREATE TABLE "Province" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "plateNumber" TEXT,
    "vin" TEXT,
    "fuelType" "FuelType",
    "transmission" TEXT,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "pricePerDay" DOUBLE PRECISION,
    "pricePerHour" DOUBLE PRECISION,
    "images" TEXT[],
    "description" TEXT,
    "provinceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DumpTruck" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "bedType" TEXT,
    "bedCapacity" DOUBLE PRECISION,
    "capacityUnit" TEXT,
    "payloadWeight" DOUBLE PRECISION,
    "axleCount" INTEGER,
    "dumpAngle" DOUBLE PRECISION,
    "gvwr" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DumpTruck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tanker" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "tankCapacity" DOUBLE PRECISION,
    "capacityUnit" TEXT,
    "tankMaterial" TEXT,
    "compartments" INTEGER,
    "insulated" BOOLEAN NOT NULL DEFAULT false,
    "pumpType" TEXT,
    "liquidType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tanker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Excavator" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "boomLength" DOUBLE PRECISION,
    "bucketCapacity" DOUBLE PRECISION,
    "diggingDepth" DOUBLE PRECISION,
    "operatingWeight" DOUBLE PRECISION,
    "trackType" TEXT,
    "engineHP" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Excavator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Taxi" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "seats" INTEGER,
    "luggageCapacity" INTEGER,
    "hasMeter" BOOLEAN NOT NULL DEFAULT true,
    "licenseClass" TEXT,
    "ac" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Taxi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyTruck" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "bodyType" TEXT,
    "cargoLength" DOUBLE PRECISION,
    "cargoWidth" DOUBLE PRECISION,
    "cargoHeight" DOUBLE PRECISION,
    "maxPayload" DOUBLE PRECISION,
    "hasLiftgate" BOOLEAN NOT NULL DEFAULT false,
    "refrigerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyTruck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Province_name_key" ON "Province"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plateNumber_key" ON "Vehicle"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "DumpTruck_vehicleId_key" ON "DumpTruck"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "Tanker_vehicleId_key" ON "Tanker"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "Excavator_vehicleId_key" ON "Excavator"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "Taxi_vehicleId_key" ON "Taxi"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "BodyTruck_vehicleId_key" ON "BodyTruck"("vehicleId");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DumpTruck" ADD CONSTRAINT "DumpTruck_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tanker" ADD CONSTRAINT "Tanker_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Excavator" ADD CONSTRAINT "Excavator_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Taxi" ADD CONSTRAINT "Taxi_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyTruck" ADD CONSTRAINT "BodyTruck_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
