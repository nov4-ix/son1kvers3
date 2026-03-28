"""
Logging Utilities
Structured logging for the Music Lab
"""

import logging
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional
import json

LOG_DIR = Path(__file__).parent.parent / "outputs" / "reports"
LOG_DIR.mkdir(parents=True, exist_ok=True)


class MusicLabFormatter(logging.Formatter):
    FORMATS = {
        logging.DEBUG: "\033[36m[DEBUG]\033[0m %(message)s",
        logging.INFO: "\033[32m[INFO]\033[0m %(message)s",
        logging.WARNING: "\033[33m[WARN]\033[0m %(message)s",
        logging.ERROR: "\033[31m[ERROR]\033[0m %(message)s",
        logging.CRITICAL: "\033[35m[CRITICAL]\033[0m %(message)s",
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno, "%(message)s")
        formatter = logging.Formatter(f"[%(name)s] {log_fmt}")
        return formatter.format(record)


def setup_logger(
    name: str, level: int = logging.INFO, log_to_file: bool = True
) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(level)

    if logger.handlers:
        return logger

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(MusicLabFormatter())
    logger.addHandler(console_handler)

    if log_to_file:
        timestamp = datetime.now().strftime("%Y%m%d")
        log_file = LOG_DIR / f"music_lab_{timestamp}.log"
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setLevel(level)
        file_handler.setFormatter(
            logging.Formatter("%(asctime)s [%(name)s] %(levelname)s: %(message)s")
        )
        logger.addHandler(file_handler)

    return logger


class PerformanceTracker:
    def __init__(self, name: str):
        self.name = name
        self.logger = setup_logger(f"perf.{name}")
        self.start_time = None
        self.checkpoints = []
        self.metrics = {}

    def __enter__(self):
        import time

        self.start_time = time.time()
        self.logger.info(f"Started: {self.name}")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        import time

        total_time = time.time() - self.start_time
        self.metrics["total_time"] = total_time
        self.logger.info(f"Completed: {self.name} in {total_time:.2f}s")
        return False

    def checkpoint(self, name: str):
        import time

        elapsed = time.time() - self.start_time
        self.checkpoints.append({"name": name, "time": elapsed})
        self.logger.info(f"Checkpoint [{name}]: {elapsed:.2f}s elapsed")

    def add_metric(self, key: str, value):
        self.metrics[key] = value

    def get_report(self) -> dict:
        return {
            "name": self.name,
            "checkpoints": self.checkpoints,
            "metrics": self.metrics,
        }


def log_gpu_memory(logger: logging.Logger):
    try:
        import torch

        if torch.cuda.is_available():
            allocated = torch.cuda.memory_allocated() / 1e6
            reserved = torch.cuda.memory_reserved() / 1e6
            logger.info(
                f"GPU Memory - Allocated: {allocated:.1f}MB, Reserved: {reserved:.1f}MB"
            )
            return allocated, reserved
    except Exception:
        pass
    return 0, 0


def save_experiment_log(data: dict, filename: Optional[str] = None):
    if filename is None:
        filename = f"experiment_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    filepath = LOG_DIR / filename
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)

    return filepath
