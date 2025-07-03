// Debug script for sticky positioning issues
// Run this in the browser console on the page with the sticky problem

(() => {
  console.log('=== STICKY POSITION DEBUGGER ===');
  
  // Find the sticky element
  const stickyElement = document.querySelector('.sticky-preview');
  
  if (!stickyElement) {
    console.error('❌ No element with class .sticky-preview found');
    return;
  }
  
  console.log('✅ Found sticky element:', stickyElement);
  
  // Check computed styles
  const computedStyle = window.getComputedStyle(stickyElement);
  console.log('\n📊 Computed Styles:');
  console.log('- position:', computedStyle.position);
  console.log('- top:', computedStyle.top);
  console.log('- z-index:', computedStyle.zIndex);
  console.log('- display:', computedStyle.display);
  
  // Check browser support
  const supportsSticky = CSS.supports('position', 'sticky') || CSS.supports('position', '-webkit-sticky');
  console.log('\n🌐 Browser Support:');
  console.log('- Supports sticky:', supportsSticky);
  
  // Check parent elements for overflow issues
  console.log('\n🔍 Checking parent elements for overflow issues:');
  let parent = stickyElement.parentElement;
  let overflowIssues = [];
  let parentIndex = 0;
  
  while (parent && parent !== document.documentElement) {
    const parentStyle = window.getComputedStyle(parent);
    const overflow = {
      element: parent,
      index: parentIndex++,
      tag: parent.tagName,
      className: parent.className || '(no class)',
      id: parent.id || '(no id)',
      overflow: parentStyle.overflow,
      overflowX: parentStyle.overflowX,
      overflowY: parentStyle.overflowY,
      position: parentStyle.position,
      display: parentStyle.display,
      height: parentStyle.height
    };
    
    // Check for problematic overflow values
    if (parentStyle.overflow === 'hidden' || 
        parentStyle.overflowX === 'hidden' || 
        parentStyle.overflowY === 'hidden' ||
        parentStyle.overflow === 'auto' ||
        parentStyle.overflow === 'scroll') {
      overflowIssues.push(overflow);
      console.warn(`⚠️ Parent ${parentIndex - 1}:`, overflow);
    } else {
      console.log(`✅ Parent ${parentIndex - 1}:`, overflow);
    }
    
    parent = parent.parentElement;
  }
  
  if (overflowIssues.length > 0) {
    console.error('\n❌ Found parent elements with problematic overflow:', overflowIssues);
    console.log('🔧 Fix: Remove overflow hidden/auto/scroll from these parent elements');
  } else {
    console.log('\n✅ No overflow issues found in parent elements');
  }
  
  // Check grid container
  const gridContainer = document.querySelector('.generator-grid');
  if (gridContainer) {
    const gridStyle = window.getComputedStyle(gridContainer);
    console.log('\n📐 Grid Container Styles:');
    console.log('- display:', gridStyle.display);
    console.log('- align-items:', gridStyle.alignItems);
    console.log('- grid-template-columns:', gridStyle.gridTemplateColumns);
    console.log('- gap:', gridStyle.gap);
  }
  
  // Check sticky container height
  const stickyContainer = stickyElement.parentElement;
  if (stickyContainer) {
    console.log('\n📏 Sticky Container:');
    console.log('- Height:', stickyContainer.offsetHeight + 'px');
    console.log('- Position:', window.getComputedStyle(stickyContainer).position);
  }
  
  // Monitor scroll behavior
  console.log('\n📜 Scroll Monitoring (scroll the page to see updates):');
  let scrollHandler = () => {
    const rect = stickyElement.getBoundingClientRect();
    console.log(`Scroll Y: ${window.scrollY}px, Sticky top: ${rect.top}px`);
  };
  
  window.addEventListener('scroll', scrollHandler);
  
  // Provide fix suggestions
  console.log('\n💡 Common Fixes:');
  console.log('1. Remove overflow: hidden from parent elements');
  console.log('2. Ensure grid container has align-items: start');
  console.log('3. Check that sticky element has position: sticky and top value');
  console.log('4. Verify parent container has sufficient height');
  
  // Clean up function
  window.debugStickyCleanup = () => {
    window.removeEventListener('scroll', scrollHandler);
    console.log('✅ Cleanup complete');
  };
  
  console.log('\n🧹 To clean up scroll monitoring, run: window.debugStickyCleanup()');
})();