<template>
   <div class="editor-codigo">
      <textarea 
         :value="valor"
         @input="$emit('actualizar', ($event.target as HTMLTextAreaElement).value)"
         rows="20"
         spellcheck="false"
         autocomplete="off"  
         style="width: 100%; resize: none; font-family: monospace;"
      ></textarea>
   </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

const props = defineProps<{ valor: string }>()
const emit = defineEmits<{ (e: 'actualizar', v: string): void }>()

function handleInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement
    emit('actualizar', target.value)
}
</script>  

<style scoped>
.editor-codigo textarea { 
   display: block; 
   width: 100%; 
   height: 100%; 
   border: none; 
   resize: none; 
   font-family: monospace; 
   background: transparent;  
}
</style>
