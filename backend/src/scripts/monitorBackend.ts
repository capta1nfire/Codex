#!/usr/bin/env tsx
import * as os from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface ProcessInfo {
  pid: number;
  cpu: number;
  memory: number;
  command: string;
}

async function getProcessInfo(): Promise<ProcessInfo[]> {
  try {
    const { stdout } = await execAsync(
      'ps aux | grep -E "(tsx|node.*backend)" | grep -v grep | grep -v monitorBackend'
    );
    
    const lines = stdout.trim().split('\n').filter(line => line.length > 0);
    return lines.map(line => {
      const parts = line.split(/\s+/);
      return {
        pid: parseInt(parts[1]),
        cpu: parseFloat(parts[2]),
        memory: parseFloat(parts[3]),
        command: parts.slice(10).join(' ')
      };
    });
  } catch {
    return [];
  }
}

async function checkPortStatus(port: number): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`lsof -ti :${port}`);
    return !!stdout.trim();
  } catch {
    return false;
  }
}

async function getMemoryUsage(): Promise<any> {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return {
    total: Math.round(totalMem / 1024 / 1024),
    free: Math.round(freeMem / 1024 / 1024),
    used: Math.round(usedMem / 1024 / 1024),
    percentage: Math.round((usedMem / totalMem) * 100)
  };
}

async function monitor() {
  console.log('🔍 Backend Service Monitor');
  console.log('=========================\n');
  
  // Check processes
  const processes = await getProcessInfo();
  console.log('📊 Backend Processes:');
  if (processes.length === 0) {
    console.log('   ❌ No backend processes found');
  } else {
    processes.forEach(p => {
      console.log(`   PID: ${p.pid} | CPU: ${p.cpu}% | MEM: ${p.memory}% | CMD: ${p.command.substring(0, 80)}...`);
    });
  }
  
  console.log('\n🌐 Port Status:');
  const port3004 = await checkPortStatus(3004);
  console.log(`   Port 3004 (Backend): ${port3004 ? '✅ Occupied' : '❌ Free'}`);
  
  console.log('\n💾 System Memory:');
  const mem = await getMemoryUsage();
  console.log(`   Total: ${mem.total} MB | Used: ${mem.used} MB (${mem.percentage}%) | Free: ${mem.free} MB`);
  
  // Check for file changes that might trigger restarts
  console.log('\n📁 Recent File Changes:');
  try {
    const { stdout } = await execAsync(
      'find . -name "*.ts" -o -name "*.js" -o -name "*.json" | grep -v node_modules | grep -v dist | xargs ls -lt | head -10'
    );
    console.log(stdout);
  } catch (error) {
    console.log('   Unable to check file changes');
  }
  
  // Check logs for errors
  console.log('\n📝 Recent Error Log Entries:');
  try {
    const { stdout } = await execAsync(
      'tail -n 5 ../logs/backend.log | grep -E "(error|Error|ERROR|crash|Crash|CRASH|restart|Restart|RESTART)" || echo "No recent errors found"'
    );
    console.log(stdout);
  } catch {
    console.log('   No error logs found');
  }
}

// Run monitor
monitor().catch(console.error);