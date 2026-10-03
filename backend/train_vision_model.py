#!/usr/bin/env python3
"""
Manufacturing Surface Defect Classification - Transfer Learning Training Script
Target Task: Optical surface-defect classification for industrial quality control
Architecture: ResNet18 (Transfer Learning from ImageNet-1K) or MobileNetV3

Target Defect Categories:
  0: scratches
  1: patches
  2: inclusions
  3: pitted_surface
  4: rolled_in_scale
  5: crazing
  (6: no_defect / acceptable surface)

Capabilities:
- Dataset loading (directory of images by class or synthetic manufacturing surface generator)
- Train / Validation split (default: 80% train, 20% validation)
- Image preprocessing (Resize 224x224, Normalization with ImageNet mean & std)
- Data Augmentation (RandomHorizontalFlip, RandomVerticalFlip, RandomRotation, ColorJitter)
- Transfer Learning using pre-trained weights (ResNet18 backbone, customized classification head)
- Training & Validation loops with CrossEntropyLoss and Adam/SGD optimizer
- Model checkpoint saving (weights .pth + metadata .json)
- Comprehensive evaluation metrics:
    * Accuracy
    * Precision (macro & weighted)
    * Recall (macro & weighted)
    * F1-score (macro & weighted)
    * Confusion Matrix (per-class breakdown)
"""

import os
import sys
import json
import time
import argparse
from typing import Tuple, Dict, Any, List

# Target defect classes required by specification
DEFECT_CLASSES = [
    "scratches",
    "patches",
    "inclusions",
    "pitted_surface",
    "rolled_in_scale",
    "crazing",
    "no_defect"
]

def check_dependencies():
    """Checks for required machine learning packages and prints helpful guidance."""
    missing = []
    try:
        import torch
        import torchvision
    except ImportError:
        missing.append("torch torchvision (pip install torch torchvision)")
    try:
        import sklearn
    except ImportError:
        missing.append("scikit-learn (pip install scikit-learn)")
    try:
        import numpy
    except ImportError:
        missing.append("numpy (pip install numpy)")
    try:
        from PIL import Image
    except ImportError:
        missing.append("Pillow (pip install Pillow)")

    if missing:
        print("[WARNING] The following libraries are required for executing full PyTorch training:")
        for m in missing:
            print(f"  - {m}")
        return False
    return True

def create_synthetic_dataset(output_dir: str = "data/surface_defects", num_samples_per_class: int = 20):
    """
    Creates a synthetic dataset with characteristic surface defect textures
    so training can be verified immediately without external dataset downloads.
    """
    import numpy as np
    from PIL import Image, ImageDraw

    os.makedirs(output_dir, exist_ok=True)
    print(f"[INFO] Generating synthetic surface defect dataset in: {output_dir}")

    for idx, defect_name in enumerate(DEFECT_CLASSES):
        class_dir = os.path.join(output_dir, defect_name)
        os.makedirs(class_dir, exist_ok=True)

        for i in range(num_samples_per_class):
            # Base metal brushed surface (gray texture)
            base = np.random.normal(160, 15, (224, 224)).astype(np.uint8)
            img = Image.fromarray(base).convert("RGB")
            draw = ImageDraw.Draw(img)

            # Draw synthetic defect features matching defect physical characteristics
            if defect_name == "scratches":
                # Linear sharp scratches
                for _ in range(np.random.randint(1, 4)):
                    x1, y1 = np.random.randint(10, 100), np.random.randint(10, 200)
                    x2, y2 = x1 + np.random.randint(60, 120), y1 + np.random.randint(-30, 30)
                    draw.line([(x1, y1), (x2, y2)], fill=(40, 40, 40), width=np.random.randint(1, 3))
            elif defect_name == "patches":
                # Diffuse discolored oxidation / oil patches
                for _ in range(np.random.randint(1, 3)):
                    x, y = np.random.randint(40, 160), np.random.randint(40, 160)
                    r = np.random.randint(15, 35)
                    draw.ellipse([(x - r, y - r), (x + r, y + r)], fill=(110, 105, 95))
            elif defect_name == "inclusions":
                # High-contrast foreign particles / ceramic slag inclusions
                for _ in range(np.random.randint(2, 6)):
                    x, y = np.random.randint(20, 200), np.random.randint(20, 200)
                    r = np.random.randint(3, 8)
                    draw.ellipse([(x - r, y - r), (x + r, y + r)], fill=(20, 20, 25))
            elif defect_name == "pitted_surface":
                # Multiple tiny corrosive pitting micro-cavities
                for _ in range(np.random.randint(15, 30)):
                    x, y = np.random.randint(10, 210), np.random.randint(10, 210)
                    r = np.random.randint(1, 4)
                    draw.ellipse([(x - r, y - r), (x + r, y + r)], fill=(50, 50, 55))
            elif defect_name == "rolled_in_scale":
                # Wavy dark scale pressed into the rolled sheet
                for _ in range(np.random.randint(2, 4)):
                    x, y = np.random.randint(20, 180), np.random.randint(20, 180)
                    draw.arc([(x, y), (x + 60, y + 40)], start=0, end=180, fill=(30, 30, 30), width=4)
            elif defect_name == "crazing":
                # Network of fine craze micro-cracks
                cx, cy = 112, 112
                for _ in range(8):
                    angle = np.random.uniform(0, 2 * np.pi)
                    length = np.random.uniform(20, 70)
                    ex, ey = cx + length * np.cos(angle), cy + length * np.sin(angle)
                    draw.line([(cx, cy), (ex, ey)], fill=(35, 35, 35), width=1)
            # no_defect: clean brushed metal without anomalies

            img.save(os.path.join(class_dir, f"sample_{i:03d}.png"))

    print(f"[INFO] Successfully created {len(DEFECT_CLASSES) * num_samples_per_class} images across {len(DEFECT_CLASSES)} classes.")

def train_model(
    data_dir: str,
    output_model_path: str = "models/surface_defect_resnet18.pth",
    epochs: int = 5,
    batch_size: int = 16,
    learning_rate: float = 1e-3,
    val_split: float = 0.2,
    architecture: str = "resnet18"
) -> Dict[str, Any]:
    """
    Main PyTorch Transfer-Learning Training Pipeline.
    Loads dataset, splits into Train/Val, applies augmentations, fine-tunes ResNet18,
    evaluates confusion matrix / accuracy / precision / recall / F1, and saves model.
    """
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, random_split
    from torchvision import datasets, transforms, models
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"[INFO] Using training device: {device}")

    # 1. Image Preprocessing & Augmentation Pipelines
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # 2. Dataset Loading & Train/Validation Split
    full_dataset = datasets.ImageFolder(root=data_dir, transform=train_transform)
    num_classes = len(full_dataset.classes)
    class_names = full_dataset.classes
    print(f"[INFO] Loaded dataset with {len(full_dataset)} total images across classes: {class_names}")

    val_size = int(len(full_dataset) * val_split)
    train_size = len(full_dataset) - val_size
    train_dataset, val_dataset = random_split(
        full_dataset,
        [train_size, val_size],
        generator=torch.Generator().manual_seed(42)
    )

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2)

    # 3. Transfer Learning Model Setup
    print(f"[INFO] Loading transfer-learning backbone: {architecture}")
    if architecture.lower() == "resnet18":
        try:
            model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        except Exception:
            model = models.resnet18(pretrained=True)
        # Freeze initial feature extractor conv layers
        for param in list(model.parameters())[:-8]:
            param.requires_grad = False
        # Replace classification head
        in_features = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, num_classes)
        )
    elif architecture.lower() == "mobilenet":
        try:
            model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
        except Exception:
            model = models.mobilenet_v3_small(pretrained=True)
        in_features = model.classifier[3].in_features
        model.classifier[3] = nn.Linear(in_features, num_classes)
    else:
        raise ValueError(f"Unsupported architecture: {architecture}")

    model = model.to(device)

    # 4. Loss Function, Optimizer & Learning Rate Scheduler
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=learning_rate)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=3, gamma=0.5)

    # 5. Training Loop
    print("\n" + "=" * 65)
    print(f"Starting Training: {epochs} Epochs | Batch Size: {batch_size} | LR: {learning_rate}")
    print("=" * 65)

    best_val_acc = 0.0

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct_train += torch.sum(preds == labels.data).item()
            total_train += labels.size(0)

        scheduler.step()
        epoch_train_loss = running_loss / max(total_train, 1)
        epoch_train_acc = correct_train / max(total_train, 1)

        # Validation step
        model.eval()
        val_loss = 0.0
        correct_val = 0
        total_val = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                correct_val += torch.sum(preds == labels.data).item()
                total_val += labels.size(0)

        epoch_val_loss = val_loss / max(total_val, 1)
        epoch_val_acc = correct_val / max(total_val, 1)
        elapsed = time.time() - t0

        print(f"Epoch [{epoch:02d}/{epochs:02d}] ({elapsed:.1f}s) | "
              f"Train Loss: {epoch_train_loss:.4f} Acc: {epoch_train_acc:.3f} | "
              f"Val Loss: {epoch_val_loss:.4f} Acc: {epoch_val_acc:.3f}")

        if epoch_val_acc > best_val_acc:
            best_val_acc = epoch_val_acc

    # 6. Full Evaluation on Validation Set
    print("\n" + "=" * 65)
    print("Running Final Model Evaluation on Validation Set")
    print("=" * 65)

    model.eval()
    all_preds = []
    all_targets = []

    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy().tolist())
            all_targets.extend(labels.numpy().tolist())

    accuracy = float(accuracy_score(all_targets, all_preds))
    precision_weighted = float(precision_score(all_targets, all_preds, average='weighted', zero_division=0))
    precision_macro = float(precision_score(all_targets, all_preds, average='macro', zero_division=0))
    recall_weighted = float(recall_score(all_targets, all_preds, average='weighted', zero_division=0))
    recall_macro = float(recall_score(all_targets, all_preds, average='macro', zero_division=0))
    f1_weighted = float(f1_score(all_targets, all_preds, average='weighted', zero_division=0))
    f1_macro = float(f1_score(all_targets, all_preds, average='macro', zero_division=0))
    cm = confusion_matrix(all_targets, all_preds).tolist()

    print(f"  Accuracy:           {accuracy * 100:.2f}%")
    print(f"  Precision (weighted): {precision_weighted:.4f} (macro: {precision_macro:.4f})")
    print(f"  Recall (weighted):    {recall_weighted:.4f} (macro: {recall_macro:.4f})")
    print(f"  F1-Score (weighted):  {f1_weighted:.4f} (macro: {f1_macro:.4f})")
    print("\nConfusion Matrix:")
    header_label = "Actual \\ Pred"
    print(f"{header_label:<16} " + " ".join([f"{c[:4]:>5}" for c in class_names]))
    for i, row in enumerate(cm):
        cname = class_names[i] if i < len(class_names) else f"C{i}"
        row_str = " ".join([f"{val:>5d}" for val in row])
        print(f"{cname:<16} {row_str}")

    # 7. Model Checkpoint Saving
    os.makedirs(os.path.dirname(output_model_path) or ".", exist_ok=True)
    torch.save(model.state_dict(), output_model_path)
    print(f"\n[SUCCESS] Model state dictionary saved to: {output_model_path}")

    # Save model metadata alongside weights
    metadata_path = output_model_path.replace(".pth", "_metadata.json")
    metadata = {
        "model_architecture": architecture,
        "classes": class_names,
        "input_resolution": [224, 224],
        "normalization": {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]},
        "training_epochs": epochs,
        "final_accuracy": accuracy,
        "precision_weighted": precision_weighted,
        "recall_weighted": recall_weighted,
        "f1_score_weighted": f1_weighted,
        "confusion_matrix": cm,
        "trained_timestamp": time.strftime("%Y-%m-%d %H:%M:%SZ", time.gmtime()),
        "epistemic_classification": "MODEL_PREDICTION",
        "human_verification_required": True
    }
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"[SUCCESS] Model metadata saved to: {metadata_path}")

    return metadata

def main():
    parser = argparse.ArgumentParser(description="Manufacturing Surface Defect Model Training")
    parser.add_argument("--data-dir", type=str, default="data/surface_defects",
                        help="Path to directory containing subfolders for each defect category")
    parser.add_argument("--output", type=str, default="models/surface_defect_resnet18.pth",
                        help="Destination path for trained weights .pth file")
    parser.add_argument("--architecture", type=str, default="resnet18", choices=["resnet18", "mobilenet"],
                        help="Transfer learning backbone (resnet18 or mobilenet)")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size for training")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate")
    parser.add_argument("--generate-sample-data", action="store_true",
                        help="Generate synthetic surface defect images for testing")

    args = parser.parse_args()

    deps_ok = check_dependencies()
    if not deps_ok:
        print("\n[NOTE] PyTorch is required to execute the training loop.")
        print("To install all dependencies, run:")
        print("  pip install torch torchvision scikit-learn numpy pillow\n")
        sys.exit(1)

    if args.generate_sample_data or not os.path.exists(args.data_dir):
        print(f"[INFO] Dataset directory '{args.data_dir}' not found or sample flag provided.")
        create_synthetic_dataset(args.data_dir)

    train_model(
        data_dir=args.data_dir,
        output_model_path=args.output,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
        architecture=args.architecture
    )

if __name__ == "__main__":
    main()
