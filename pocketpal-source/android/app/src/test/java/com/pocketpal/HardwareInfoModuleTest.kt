package com.pocketpal

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class HardwareInfoModuleTest {
  @Test
  fun excludesCoresAtExactlyHalfOfMaximumCapacity() {
    assertEquals(
      4,
      countPerformanceCores(
        listOf(512, 512, 512, 512, 996, 1000, 1010, 1024),
      ),
    )
  }

  @Test
  fun identifiesThePOCOStylePerformanceCluster() {
    assertEquals(
      4,
      countPerformanceCores(
        listOf(221, 221, 221, 221, 996, 996, 1000, 1024),
      ),
    )
  }

  @Test
  fun rejectsUniformOrSingleCoreCapacityData() {
    assertNull(countPerformanceCores(List(8) { 1024 }))
    assertNull(countPerformanceCores(listOf(200, 200, 200, 1024)))
    assertNull(countPerformanceCores(listOf(0, 0, 0, 0)))
  }
}
