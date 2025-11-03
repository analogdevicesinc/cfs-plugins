define decodeInterruptCause
    set $cause = $arg0
    if $cause == 0
        printf " (User software interrupt)\n"
    end
    if $cause == 1
        printf " (Supervisor software interrupt)\n"
    end
    if $cause == 3
        printf " (Machine software interrupt)\n"
    end
    if $cause == 4
        printf " (User timer interrupt)\n"
    end
    if $cause == 5
        printf " (Supervisor timer interrupt)\n"
    end
    if $cause == 7
        printf " (Machine timer interrupt)\n"
    end
    if $cause == 8
        printf " (User external interrupt)\n"
    end
    if $cause == 9
        printf " (Supervisor external interrupt)\n"
    end
    if $cause == 11
        printf " (Machine external interrupt)\n"
    end
    if $cause > 11 || ($cause > 1 && $cause < 3) || $cause == 6 || $cause == 10
        printf " (Reserved/Platform-specific)\n"
    end
end

define decodeExceptionCause
    set $cause = $arg0
    if $cause == 0
        printf " (Instruction address misaligned)\n"
    end
    if $cause == 1
        printf " (Instruction access fault)\n"
    end
    if $cause == 2
        printf " (Illegal instruction)\n"
    end
    if $cause == 3
        printf " (Breakpoint)\n"
    end
    if $cause == 4
        printf " (Load address misaligned)\n"
    end
    if $cause == 5
        printf " (Load access fault)\n"
    end
    if $cause == 6
        printf " (Store/AMO address misaligned)\n"
    end
    if $cause == 7
        printf " (Store/AMO access fault)\n"
    end
    if $cause == 8
        printf " (Environment call from U-mode)\n"
    end
    if $cause == 9
        printf " (Environment call from S-mode)\n"
    end
    if $cause == 11
        printf " (Environment call from M-mode)\n"
    end
    if $cause == 12
        printf " (Instruction page fault)\n"
    end
    if $cause == 13
        printf " (Load page fault)\n"
    end
    if $cause == 15
        printf " (Store/AMO page fault)\n"
    end
    if $cause == 10 || $cause == 14 || $cause > 15
        printf " (Reserved/Custom)\n"
    end
end

define decodePrivilegeMode
    set $mode = $arg0
    if $mode == 0
        printf " (User)"
    end
    if $mode == 1
        printf " (Supervisor)"
    end
    if $mode == 3
        printf " (Machine)"
    end
    if $mode == 2
        printf " (Reserved)"
    end
end

define decodeFpStatus
    set $fs = $arg0
    if $fs == 0
        printf " (Off)"
    end
    if $fs == 1
        printf " (Initial)"
    end
    if $fs == 2
        printf " (Clean)"
    end
    if $fs == 3
        printf " (Dirty)"
    end
end

define trapStatusRegisters
    printf "=== RISC-V Trap Status Analysis ===\n"
    
    # Machine Trap Cause Register (mcause)
    set $mcause = $mcause
    printf "Machine Trap Cause Register (mcause): 0x%08X\n", $mcause
    
    set $interrupt_bit = ($mcause >> 31) & 0x1
    set $exception_code = $mcause & 0x7FFFFFFF
    
    if $interrupt_bit
        printf "  Interrupt detected (bit 31 set)\n"
        printf "  Interrupt Cause: %d", $exception_code
        decodeInterruptCause $exception_code
    else
        printf "  Exception detected (bit 31 clear)\n"
        printf "  Exception Cause: %d", $exception_code
        decodeExceptionCause $exception_code
    end
    printf "\n"

    # Machine Trap Value Register (mtval)
    set $mtval = $mtval
    printf "Machine Trap Value Register (mtval): 0x%08X\n", $mtval
    if $mtval != 0
        # Memory access related exceptions
        if $exception_code == 0 || $exception_code == 1
            printf "  Faulting instruction address: 0x%08X\n", $mtval
        end
        if $exception_code == 4 || $exception_code == 5 || $exception_code == 6 || $exception_code == 7 || $exception_code == 13 || $exception_code == 15
            printf "  Faulting memory address: 0x%08X\n", $mtval
        end
        if $exception_code == 2
            printf "  Illegal instruction encoding: 0x%08X\n", $mtval
        end
        # Default case for other exceptions
        if $exception_code == 3 || $exception_code == 8 || $exception_code == 9 || $exception_code == 11 || $exception_code == 12
            printf "  Additional trap information: 0x%08X\n", $mtval
        end
    else
        printf "  No additional trap information available\n"
    end
    printf "\n"

    # Machine Exception Program Counter (mepc)
    set $mepc = $mepc
    printf "Machine Exception Program Counter (mepc): 0x%08X\n", $mepc
    printf "  Exception occurred at PC: 0x%08X\n", $mepc
    printf "\n"
end

define privilegeStatusRegisters
    printf "=== Privilege and Status Information ===\n"
    
    # Machine Status Register (mstatus)
    set $mstatus = $mstatus
    printf "Machine Status Register (mstatus): 0x%08X\n", $mstatus
    
    set $mie = ($mstatus >> 3) & 0x1
    set $mpie = ($mstatus >> 7) & 0x1
    set $mpp = ($mstatus >> 11) & 0x3
    set $fs = ($mstatus >> 13) & 0x3
    set $xs = ($mstatus >> 15) & 0x3
    set $mprv = ($mstatus >> 17) & 0x1
    set $sum = ($mstatus >> 18) & 0x1
    set $mxr = ($mstatus >> 19) & 0x1
    
    printf "  Status Bits:\n"
    printf "    [3] MIE: Machine interrupts %s\n", $mie ? "enabled" : "disabled"
    printf "    [7] MPIE: Previous interrupt enable = %d\n", $mpie
    printf "    [12:11] MPP: Previous privilege mode = %d", $mpp
    decodePrivilegeMode $mpp
    printf "\n"
    printf "    [14:13] FS: Floating-point status = %d", $fs
    decodeFpStatus $fs
    printf "\n"
    
    if $mprv
        printf "    [17] MPRV: Memory privilege modification enabled\n"
    end
    if $sum
        printf "    [18] SUM: Supervisor user memory access permitted\n"
    end
    if $mxr
        printf "    [19] MXR: Make executable readable\n"
    end
    printf "\n"

    # Machine Interrupt Enable Register (mie)
    set $mie_reg = $mie
    printf "Machine Interrupt Enable Register (mie): 0x%08X\n", $mie_reg
    printf "  Interrupt Enable Bits:\n"
    if $mie_reg & 0x1
        printf "    [0] USIE: User software interrupt enabled\n"
    end
    if $mie_reg & 0x2
        printf "    [1] SSIE: Supervisor software interrupt enabled\n"
    end
    if $mie_reg & 0x8
        printf "    [3] MSIE: Machine software interrupt enabled\n"
    end
    if $mie_reg & 0x10
        printf "    [4] UTIE: User timer interrupt enabled\n"
    end
    if $mie_reg & 0x20
        printf "    [5] STIE: Supervisor timer interrupt enabled\n"
    end
    if $mie_reg & 0x80
        printf "    [7] MTIE: Machine timer interrupt enabled\n"
    end
    if $mie_reg & 0x100
        printf "    [8] UEIE: User external interrupt enabled\n"
    end
    if $mie_reg & 0x200
        printf "    [9] SEIE: Supervisor external interrupt enabled\n"
    end
    if $mie_reg & 0x800
        printf "    [11] MEIE: Machine external interrupt enabled\n"
    end
    printf "\n"

    # Machine Interrupt Pending Register (mip)
    set $mip = $mip
    printf "Machine Interrupt Pending Register (mip): 0x%08X\n", $mip
    if $mip != 0
        printf "  Pending Interrupts:\n"
        if $mip & 0x1
            printf "    [0] USIP: User software interrupt pending\n"
        end
        if $mip & 0x2
            printf "    [1] SSIP: Supervisor software interrupt pending\n"
        end
        if $mip & 0x8
            printf "    [3] MSIP: Machine software interrupt pending\n"
        end
        if $mip & 0x10
            printf "    [4] UTIP: User timer interrupt pending\n"
        end
        if $mip & 0x20
            printf "    [5] STIP: Supervisor timer interrupt pending\n"
        end
        if $mip & 0x80
            printf "    [7] MTIP: Machine timer interrupt pending\n"
        end
        if $mip & 0x100
            printf "    [8] UEIP: User external interrupt pending\n"
        end
        if $mip & 0x200
            printf "    [9] SEIP: Supervisor external interrupt pending\n"
        end
        if $mip & 0x800
            printf "    [11] MEIP: Machine external interrupt pending\n"
        end
    else
        printf "  No interrupts pending\n"
    end
    printf "\n"
end

define systemInfo
    printf "=== Additional System Information ===\n"
    
    # Current execution context
    printf "Current Execution Context:\n"
    set $current_pc = $pc
    printf "Current PC: 0x%08X\n", $current_pc
    
    # Show instruction at fault location
    if $mepc != 0
        printf "\nFaulting instruction:\n"
        x/i $mepc
        printf "Disassembly around fault:\n"
        x/5i $mepc-8
    end
    
    printf "\nStack trace:\n"
    backtrace
    
    printf "\nRegister dump:\n"
    info registers
    
    # Infer current privilege mode from PC address ranges
    printf "\nCurrent privilege level: "
    if $current_pc >= 0x80000000
        printf "Machine mode (inferred from PC address)\n"
    end
    if $current_pc >= 0x40000000 && $current_pc < 0x80000000
        printf "Supervisor mode (inferred from PC address)\n"
    end
    if $current_pc < 0x40000000
        printf "User mode (inferred from PC address)\n"
    end
    printf "\n"
end

define trapAnalysisSummary
    printf "\n=== RISC-V Trap Analysis Summary ===\n"
    
    set $mcause_val = $mcause
    set $interrupt_bit = ($mcause_val >> 31) & 0x1
    set $exception_code = $mcause_val & 0x7FFFFFFF
    
    if $interrupt_bit
        printf "• INTERRUPT detected - Cause: %d\n", $exception_code
    else
        printf "• EXCEPTION detected - Cause: %d\n", $exception_code
        
        # Memory access faults
        if $exception_code == 1 || $exception_code == 5 || $exception_code == 7
            printf "  → Memory access fault\n"
        end
        # Illegal instruction
        if $exception_code == 2
            printf "  → Illegal instruction fault\n"
        end
        # Address alignment faults
        if $exception_code == 0 || $exception_code == 4 || $exception_code == 6
            printf "  → Address alignment fault\n"
        end
        # Page faults
        if $exception_code == 12 || $exception_code == 13 || $exception_code == 15
            printf "  → Page fault (virtual memory)\n"
        end
        # Other exceptions
        if $exception_code == 3 || $exception_code == 8 || $exception_code == 9 || $exception_code == 11
            printf "  → System call or breakpoint\n"
        end
    end
    
    set $mtval_val = $mtval
    if $mtval_val != 0
        printf "• Fault address/value: 0x%08X\n", $mtval_val
    end
    
    set $mepc_val = $mepc
    printf "• Exception PC: 0x%08X\n", $mepc_val
    
    set $mstatus_val = $mstatus
    set $mpp = ($mstatus_val >> 11) & 0x3
    printf "• Previous privilege: %d", $mpp
    decodePrivilegeMode $mmp
    printf "\n"
    
    printf "\n"
end

printf "=== RISC-V Processor Fault Analysis ===\n"
printf "=======================================\n\n"

trapStatusRegisters
privilegeStatusRegisters
systemInfo
trapAnalysisSummary

printf "=======================================\n"
