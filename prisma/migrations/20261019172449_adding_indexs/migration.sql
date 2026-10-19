-- CreateIndex
CREATE INDEX "idx_menu_items_public" ON "menu_items"("branch_id", "is_available", "is_online");

-- CreateIndex
CREATE INDEX "idx_order_items_menu_item" ON "order_items"("menu_item_id");
