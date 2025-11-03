define faultStatusRegisters
    # Memory Management Fault Status Register (MMFSR)
    set $mmfsr = *(unsigned char*)0xE000ED28
    printf "Memory Management Fault Status Register (MMFSR): 0x%08X\n", $mmfsr
    if $mmfsr != 0
        printf "  MMFSR Bits Set:\n"
        if $mmfsr & 0x01
            printf "    [0] IACCVIOL: Instruction access violation\n"
        end
        if $mmfsr & 0x02
            printf "    [1] DACCVIOL: Data access violation\n"
        end
        if $mmfsr & 0x08
            printf "    [3] MUNSTKERR: MemManage fault on unstacking for exception return\n"
        end
        if $mmfsr & 0x10
            printf "    [4] MSTKERR: MemManage fault on stacking for exception entry\n"
        end
        if $mmfsr & 0x20
            printf "    [5] MLSPERR: MemManage fault during floating-point lazy state preservation\n"
        end
        if $mmfsr & 0x80
            printf "    [7] MMARVALID: MMFAR holds valid fault address\n"
            set $mmfar = *(unsigned int*)0xE000ED34
            printf "        Memory Management Fault Address (MMFAR): 0x%08X\n", $mmfar
        end
    else
        printf "  No Memory Management faults detected\n"
    end
    printf "\n"

    # Bus Fault Status Register (BFSR)
    set $bfsr = *(unsigned char*)0xE000ED29
    printf "Bus Fault Status Register (BFSR): 0x%08X\n", $bfsr
    if $bfsr != 0
        printf "  BFSR Bits Set:\n"
        if $bfsr & 0x01
            printf "    [0] IBUSERR: Instruction bus error\n"
        end
        if $bfsr & 0x02
            printf "    [1] PRECISERR: Precise data bus error\n"
        end
        if $bfsr & 0x04
            printf "    [2] IMPRECISERR: Imprecise data bus error\n"
        end
        if $bfsr & 0x08
            printf "    [3] UNSTKERR: BusFault on unstacking for exception return\n"
        end
        if $bfsr & 0x10
            printf "    [4] STKERR: BusFault on stacking for exception entry\n"
        end
        if $bfsr & 0x20
            printf "    [5] LSPERR: BusFault during floating-point lazy state preservation\n"
        end
        if $bfsr & 0x80
            printf "    [7] BFARVALID: BFAR holds valid fault address\n"
            set $bfar = *(unsigned int*)0xE000ED38
            printf "        Bus Fault Address (BFAR): 0x%08X\n", $bfar
        end
    else
        printf "  No Bus faults detected\n"
    end
    printf "\n"

    # Usage Fault Status Register (UFSR)
    set $ufsr = *(unsigned short*)0xE000ED2A
    printf "Usage Fault Status Register (UFSR): 0x%08X\n", $ufsr
    if $ufsr != 0
        printf "  UFSR Bits Set:\n"
        if $ufsr & 0x0001
            printf "    [0] UNDEFINSTR: Undefined instruction usage fault\n"
        end
        if $ufsr & 0x0002
            printf "    [1] INVSTATE: Invalid state usage fault\n"
        end
        if $ufsr & 0x0004
            printf "    [2] INVPC: Invalid PC load usage fault\n"
        end
        if $ufsr & 0x0008
            printf "    [3] NOCP: No coprocessor usage fault\n"
        end
        if $ufsr & 0x0100
            printf "    [8] UNALIGNED: Unaligned access usage fault\n"
        end
        if $ufsr & 0x0200
            printf "    [9] DIVBYZERO: Divide by zero usage fault\n"
        end
    else
        printf "  No Usage faults detected\n"
    end
    printf "\n"

    # Hard Fault Status Register (HFSR)
    set $hfsr = *(unsigned int*)0xE000ED2C
    printf "Hard Fault Status Register (HFSR): 0x%08X\n", $hfsr
    if $hfsr != 0
        printf "  HFSR Bits Set:\n"
        if $hfsr & 0x00000002
            printf "    [1] VECTTBL: Vector table hard fault\n"
        end
        if $hfsr & 0x40000000
            printf "    [30] FORCED: Forced hard fault (escalated from other faults)\n"
        end
        if $hfsr & 0x80000000
            printf "    [31] DEBUGEVT: Hard fault triggered by debug event\n"
        end
    else
        printf "  No Hard faults detected\n"
    end
    printf "\n"

    # Debug Fault Status Register (DFSR)
    set $dfsr = *(unsigned int*)0xE000ED30
    printf "Debug Fault Status Register (DFSR): 0x%08X\n", $dfsr
    if $dfsr != 0
        printf "  DFSR Bits Set:\n"
        if $dfsr & 0x00000001
            printf "    [0] HALTED: Halt request debug fault\n"
        end
        if $dfsr & 0x00000002
            printf "    [1] BKPT: Breakpoint debug fault\n"
        end
        if $dfsr & 0x00000004
            printf "    [2] DWTTRAP: Data Watchpoint and Trace (DWT) debug fault\n"
        end
        if $dfsr & 0x00000008
            printf "    [3] VCATCH: Vector catch debug fault\n"
        end
        if $dfsr & 0x00000010
            printf "    [4] EXTERNAL: External debug request fault\n"
        end
    else
        printf "  No Debug faults detected\n"
    end
    printf "\n"

    printf "\n=== Fault Analysis Summary ===\n"
    set $total_faults = 0
    if $mmfsr != 0
        set $total_faults = $total_faults + 1
        printf "• Memory Management fault detected\n"
    end
    if $bfsr != 0
        set $total_faults = $total_faults + 1
        printf "• Bus fault detected\n"
    end
    if $ufsr != 0
        set $total_faults = $total_faults + 1
        printf "• Usage fault detected\n"
    end
    if $hfsr != 0
        set $total_faults = $total_faults + 1
        printf "• Hard fault detected\n"
    end
    if $dfsr != 0
        set $total_faults = $total_faults + 1
        printf "• Debug fault detected\n"
    end

    if $total_faults == 0
        printf "• No faults currently detected\n"
    end

    # Current Exception Number
    set $icsr = *(unsigned int*)0xE000ED04
    set $exception_num = $icsr & 0x1FF
    printf "Current Exception Number: %d", $exception_num
    if $exception_num == 3
        printf " (HardFault)\n"
    else
        if $exception_num == 4
            printf " (MemManage)\n"
        else
            if $exception_num == 5
                printf " (BusFault)\n"
            else
                if $exception_num == 6
                    printf " (UsageFault)\n"
                else
                    if $exception_num == 0
                        printf " (Thread mode)\n"
                    else
                        printf " (Other)\n"
                    end
                end
            end
        end
    end
    printf "\n"
end

define controlRegisters
    printf "=== Control Register Information ===\n"

    # System Control Block - Configuration and Control Register
    set $ccr = *(unsigned int*)0xE000ED14
    printf "Configuration and Control Register (CCR): 0x%08X\n", $ccr
    if $ccr & 0x00000008
        printf "  [3] UNALIGN_TRP: Unaligned access trap enabled\n"
    end
    if $ccr & 0x00000010
        printf "  [4] DIV_0_TRP: Divide by zero trap enabled\n"
    end
    if $ccr & 0x00000200
        printf "  [9] STKALIGN: Stack alignment on exception entry\n"
    end
    printf "\n"

    # System Handler Control and State Register
    set $shcsr = *(unsigned int*)0xE000ED24
    printf "System Handler Control and State Register (SHCSR): 0x%08X\n", $shcsr
    printf "  Fault Handlers Enabled:\n"
    if $shcsr & 0x00010000
        printf "    [16] MEMFAULTENA: MemManage fault handler enabled\n"
    end
    if $shcsr & 0x00020000
        printf "    [17] BUSFAULTENA: BusFault handler enabled\n"
    end
    if $shcsr & 0x00040000
        printf "    [18] USGFAULTENA: UsageFault handler enabled\n"
    end
    printf "\n"
end

define stackInfo
    printf "=== Additional System Information ===\n"
    # Determine active stack pointer and saved PC offset
    set $lr_value = $lr
    set $saved_pc_offset = 24

    if (($lr_value & 0x4) == 0)
        set $stackptr = $msp
    else
        set $stackptr = $psp
    end

    if ($stackptr == 0)
        printf "Error: Stack pointer is invalid (0x%08X).\n", $stackptr
        return
    end

    # Extract saved PC from stack
    set $saved_pc = *((unsigned int *)($stackptr + $saved_pc_offset))

    if $mmfsr != 0 || $bfsr != 0 || $ufsr != 0 || $hfsr != 0 
        printf "Fault occurred at PC: 0x%08X\n", $saved_pc
        list *$saved_pc
        info line *$saved_pc
        x/i $saved_pc
    else
        printf "No fault detected. PC: 0x%08X\n", $saved_pc
    end

    printf "Stack Trace:\n"
    backtrace

    printf "Registers:\n"
    info registers
end

printf "=== Cortex-M Fault Status Analysis ===\n"
printf "========================================\n\n"

faultStatusRegisters
controlRegisters
stackInfo

printf "\n========================================\n"
