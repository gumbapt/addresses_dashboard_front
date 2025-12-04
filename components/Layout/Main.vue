<script setup lang="ts">
import { ref, shallowRef, computed } from "vue";
import sidebarItems from "@/components/Layout/Full/vertical-sidebar/sidebarItem";
// Icon Imports
import { Menu2Icon, BellRingingIcon } from "vue-tabler-icons";

const { hasPermission, isSuperAdmin } = usePermissions();

// Function to check if an item should be displayed
const shouldShowItem = (item: any) => {
  // If item is Super Admin only, check that first
  if (item.superAdminOnly) {
    return isSuperAdmin.value;
  }
  
  // If no permission defined, always show
  if (!item.permission) {
    return true;
  }
  
  // Super admin sees everything
  if (isSuperAdmin.value) {
    return true;
  }
  
  // Check specific permission
  return hasPermission(item.permission);
};

// Filter menu items to only show visible ones and headers with visible items
const filteredSidebarMenu = computed(() => {
  const filtered: any[] = [];
  let currentHeader: any = null;
  
  for (let i = 0; i < sidebarItems.length; i++) {
    const item = sidebarItems[i];
    
    // If it's a header, check if there are visible items after it
    if (item.header) {
      // Look ahead to see if there are any visible items before the next header
      let hasVisibleItems = false;
      for (let j = i + 1; j < sidebarItems.length; j++) {
        const nextItem = sidebarItems[j];
        // If we hit another header, stop looking
        if (nextItem.header) {
          break;
        }
        // Check if this item should be shown
        if (shouldShowItem(nextItem)) {
          hasVisibleItems = true;
          break;
        }
      }
      
      // Only add header if there are visible items after it
      if (hasVisibleItems) {
        filtered.push(item);
        currentHeader = item;
      }
    } else {
      // Regular item - only add if it should be shown
      if (shouldShowItem(item)) {
        filtered.push(item);
      }
    }
  }
  
  return filtered;
});

const sidebarMenu = computed(() => filteredSidebarMenu.value);
const sDrawer = ref(true);
</script>

<template>
  <v-navigation-drawer
    left
    v-model="sDrawer"
    app
    class="leftSidebar bg-containerBg"
    elevation="10"
    width="270"
  >
    <div class="pa-5 pl-4">
      <LayoutFullLogoDark />
    </div>
    <!-- ---------------------------------------------- -->
    <!---Navigation -->
    <!-- ---------------------------------------------- -->
    <perfect-scrollbar class="scrollnavbar bg-containerBg overflow-y-hidden">
      <v-list class="py-4 px-4 bg-containerBg">
        <!---Menu Loop -->
        <template v-for="(item, i) in sidebarMenu">
          <!---Item Sub Header -->
          <LayoutFullVerticalSidebarNavGroup
            :item="item"
            v-if="item.header"
            :key="item.title"
          />
          <!---If Has Child -->
          <LayoutFullVerticalSidebarNavCollapse class="leftPadding" :item="item" :level="0" v-else-if="item.children" />
          <!---Single Item-->
          <LayoutFullVerticalSidebarNavItem
            :item="item"
            v-else
            class="leftPadding"
          />
          <!---End Single Item-->
        </template>
        <!-- <Moreoption/> -->
      </v-list>
    </perfect-scrollbar>
  </v-navigation-drawer>
  <div class="container verticalLayout">
    <div class="maxWidth px-xl-0 px-sm-5 px-0">
      <v-app-bar elevation="0" height="70" class="top-header">
        <div class="d-flex align-center justify-space-between w-100">
          <div>
            <v-btn
              class="hidden-lg-and-up text-muted"
              @click="sDrawer = !sDrawer"
              icon
              variant="flat"
              size="small"
            >
              <Menu2Icon size="20" stroke-width="1.5" />
            </v-btn>
            <!-- Notification -->
            <!-- <LayoutFullVerticalHeaderNotificationDD /> -->
          </div>
          <div>
            <!-- User Profile -->
            <LayoutFullVerticalHeaderProfileDD />
          </div>
        </div>
      </v-app-bar>
    </div>
  </div>
</template>
