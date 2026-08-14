.. zephyr:code-sample:: littlefs
   :name: LittleFS filesystem
   :relevant-api: file_system_api flash_area_api

   Use file system API over LittleFS.

Overview
********

This sample app demonstrates use of Zephyr's :ref:`file system API
<file_system_api>` over `littlefs`_, using file system with files that:
* count the number of times the system has booted
* holds binary pattern with properly incremented values in it

Other information about the file system is also displayed.

.. _littlefs:
   https://github.com/ARMmbed/littlefs

Requirements
************

Flash memory device
-------------------

The partition labeled "storage" will be used for the file system; see
:ref:`flash_map_api`.  If that area does not already have a
compatible littlefs file system its contents will be replaced by an
empty file system.  You will see diagnostics like this::

   [00:00:00.010,192] <inf> littlefs: LittleFS version 2.0, disk version 2.0
   [00:00:00.010,559] <err> littlefs: Corrupted dir pair at 0 1
   [00:00:00.010,559] <wrn> littlefs: can't mount (LFS -84); formatting

The error and warning are normal for a new file system.

After the file system is mounted you'll also see::

   [00:00:00.182,434] <inf> littlefs: filesystem mounted!
   [00:00:00.867,034] <err> fs: failed get file or dir stat (-2)

This error is also normal for Zephyr not finding a file (the boot count,
in this case).

Block device (e.g. SD card)
---------------------------

One needs to prepare the SD/MMC card with littlefs file system on
the host machine with the `lfs`_ program.

.. _lfs:
   https://www.thevtool.com/mounting-littlefs-on-linux-machine/

.. code-block:: console

   sudo chmod a+rw /dev/sda
   lfs -d -s -f --read_size=512 --prog_size=512 --block_size=512 --cache_size=512 --lookahead_size=8192 --format /dev/sda
   lfs -d -s -f --read_size=512 --prog_size=512 --block_size=512 --cache_size=512 --lookahead_size=8192 /dev/sda ./mnt_littlefs
   cd ./mnt_littlefs
   echo -en '\x01' > foo.txt
   cd -
   fusermount -u ./mnt_littlefs


Building and Running
********************

Flash memory device
-------------------

This example should work on any board that provides a "storage"
partition. On these boards the file system is placed in the SoC flash.

You can set ``CONFIG_APP_WIPE_STORAGE`` to force the file system to be
recreated.

Press **Pristine Build** and then **Flash** directly in the CodeFusion Studio (CFS) tool.

Block device (e.g. SD card)
---------------------------

This backend can be run on any board with an SD/MMC card connected to it.
Build with ``-DCONF_FILE=prj_blk.conf`` to select the block-device storage backend, then
press **Pristine Build** and **Flash** directly in the CodeFusion Studio (CFS) tool.

At the moment, only two types of block devices are acceptable in this sample: SDMMC and MMC.

It is possible that both the ``zephyr,sdmmc-disk`` and ``zephyr,mmc-disk`` block devices will be
present and enabled in the final board dts and configuration files simultaneously, the mount
point name for the ``littlefs`` file system block device will be determined based on the
following logic:

* if the :kconfig:option:`CONFIG_DISK_DRIVER_SDMMC` configuration is defined, ``"SD"``
  will be used as the mount point name;
* if the :kconfig:option:`CONFIG_DISK_DRIVER_SDMMC` configuration is not defined, but the
  :kconfig:option:`CONFIG_DISK_DRIVER_MMC` configuration is defined, ``"SD2"`` will
  be used as the mount point name;
* if neither :kconfig:option:`CONFIG_DISK_DRIVER_SDMMC` nor :kconfig:option:`CONFIG_DISK_DRIVER_MMC`
  configurations are defined, the mount point name will not be determined, and an appropriate error
  will appear during the sample build.

.. note::

   On the following MAX32xxx-based boards, only the flash-backed storage backend
   is supported by this sample:

   * :zephyr:board:`max32655evkit`
   * :zephyr:board:`max32655fthr`
   * :zephyr:board:`max32657evkit`
   * :zephyr:board:`max32658evkit`
   * :zephyr:board:`max32666evkit`
   * :zephyr:board:`max32666fthr`
   * :zephyr:board:`max32672evkit`
   * :zephyr:board:`max32690evkit`
   * :zephyr:board:`max32690apard`
   * :zephyr:board:`max32690fthr`
   * :zephyr:board:`max78000evkit`
   * :zephyr:board:`max78000fthr`

   For these boards, only the :kconfig:option:`CONFIG_APP_LITTLEFS_STORAGE_FLASH`
   configuration is supported. The block-device backend
   :kconfig:option:`CONFIG_APP_LITTLEFS_STORAGE_BLK_SDMMC` is not supported.
