set $NVIC_BASE = 0xE000E100
set $NVIC_ISER0 = 0xE000E100
set $NVIC_ISER1 = 0xE000E104
set $NVIC_ISER2 = 0xE000E108
set $NVIC_ICER0 = 0xE000E180
set $NVIC_ICER1 = 0xE000E184
set $NVIC_ICER2 = 0xE000E188
set $NVIC_ISPR0 = 0xE000E200
set $NVIC_ISPR1 = 0xE000E204
set $NVIC_ISPR2 = 0xE000E208
set $NVIC_ICPR0 = 0xE000E280
set $NVIC_ICPR1 = 0xE000E284
set $NVIC_ICPR2 = 0xE000E288
set $NVIC_IABR0 = 0xE000E300
set $NVIC_IABR1 = 0xE000E304
set $NVIC_IABR2 = 0xE000E308
set $NVIC_IPR0  = 0xE000E400

# System Control Block (SCB) registers
set $SCB_VTOR   = 0xE000ED08
set $SCB_ICSR   = 0xE000ED04
set $SCB_SHCSR  = 0xE000ED24
set $SCB_CFSR   = 0xE000ED28
set $SCB_HFSR   = 0xE000ED2C
set $SCB_DFSR   = 0xE000ED30

define check_handlers
if $argc != 2
    printf "Internal error: check-interrupt-handlers needs 2 arguments\n"
else
    set $reg_value = $arg0
    set $base_irq = $arg1
    set $bit = 0

    while $bit < 32
        set $mask = 1 << $bit
        if ($reg_value & $mask) != 0
            set $irq_num = $base_irq + $bit
            set $vector_offset = ($irq_num + 16) * 4
            # Mask for thumb bit
            set $handler_addr = {int}($VECTOR_TABLE + $vector_offset) & 0xFFFFFFFE
            
            printf "IRQ %d (Vector %d): ", $irq_num, ($irq_num + 16)
 
            # The linker doesn't seem to use the default handler for unimplemented handlers. Leaving this in however if
            # this changes
            if $handler_addr == 0 || $handler_addr == 0xFFFFFFFF || $handler_addr == &Default_Handler
                printf "UNHANDLED! (Handler: NULL)\n"
            else
                # Unfortunately this is about as much error handling as we can do with base gdb and no inline python
                info symbol $handler_addr
                info line *$handler_addr
                list *$handler_addr
                printf "\n\n"
            end
        end

        set $bit = $bit + 1
    end
end
end

printf "=== Cortex-M Handler Analysis ===\n"
printf "=================================\n\n"

set $vtor = {int}$SCB_VTOR
set $VECTOR_TABLE = $vtor
printf "Vector Table Base: 0x%08x\n", $VECTOR_TABLE
printf "\n"

# Read NVIC enable registers
set $iser0 = {int}$NVIC_ISER0
set $iser1 = {int}$NVIC_ISER1
set $iser2 = {int}$NVIC_ISER2

printf "=== NVIC State Summary ===\n"
printf "Enabled Interrupts (ISER):\n"
printf "  ISER0: 0x%08x\n", $iser0
printf "  ISER1: 0x%08x\n", $iser1
printf "  ISER2: 0x%08x\n", $iser2

set $icsr = {int}$SCB_ICSR
set $vectactive = $icsr & 0x1FF
set $vectpending = ($icsr >> 12) & 0x1FF

printf "  Active Vector:   %d", $vectactive
if $vectactive == 0
    printf " (Thread mode)\n"
else
    if $vectactive <= 15
        printf " (System exception)\n"
    else
        printf " (IRQ %d)\n", ($vectactive - 16)
    end
end

printf "  Pending Vector:  %d", $vectpending
if $vectpending == 0
    printf " (None)\n"
else
    if $vectpending <= 15
        printf " (System exception)\n"
    else
        printf " (IRQ %d)\n", ($vectpending - 16)
    end
end

printf "\n=== Interrupt Handlers ===\n"
check_handlers $iser0 0
check_handlers $iser1 32
check_handlers $iser2 64

printf "\n=== System Handlers ===\n"
# Similar to check_handlers, this is about as much error handling we can do without inline python and the current linker
printf "HardFault_Handler: 0x%08x - ", &HardFault_Handler
if &HardFault_Handler == &Default_Handler
    printf "Warning: HardFault_Handler uses the Default Handler\n"
else 
    if &HardFault_Handler == 0x00000000 || &HardFault_Handler == 0xFFFFFFFF
        print "Warning: Invalid HardFault_Handler"
    else
        info line HardFault_Handler
    end
end

printf "\n"
