-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "branchedFromMessageId" TEXT,
ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "Conversation_parentId_idx" ON "Conversation"("parentId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
